/**
 * UiPath API Client
 * Handles authentication and API calls to UiPath Orchestrator
 */

export interface UiPathConfig {
  tenantUrl: string;
  clientId: string;
  clientSecret: string;
  folderId?: string;
}

export interface PermitCasePayload {
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  permit_type: string;
  site_address: string;
  site_description: string;
  documents: string[];
}

export class UiPathClient {
  private config: UiPathConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: UiPathConfig) {
    this.config = config;
  }

  /**
   * Authenticate with UiPath and get access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = `${this.config.tenantUrl}/identity_/connect/token`;
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'OR.Execution OR.Folders OR.Assets',
    });

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`UiPath auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    if (!this.accessToken) {
      throw new Error("UiPath access token is undefined after authentication");
    }

    return this.accessToken;
  }

  /**
   * Trigger Maestro Case via API Workflow
   */
  async createPermitCase(payload: PermitCasePayload): Promise<{ caseId: string }> {
    const token = await this.authenticate();

    // This would be your actual API trigger URL from UiPath
    const apiTriggerUrl = `${this.config.tenantUrl}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`;

    const jobPayload = {
      startInfo: {
        ReleaseKey: process.env.UIPATH_PERMIT_PROCESS_KEY,
        Strategy: 'Specific',
        RobotIds: [],
        NoOfRobots: 0,
        JobsCount: 0,
        InputArguments: JSON.stringify(payload),
      },
    };

    const response = await fetch(apiTriggerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': this.config.folderId || '',
      },
      body: JSON.stringify(jobPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create permit case: ${error}`);
    }

    const result = await response.json();
    
    // Extract case ID from response
    return {
      caseId: result.value?.[0]?.Key || result.Key,
    };
  }

  /**
   * Get case status from Orchestrator
   */
  async getCaseStatus(caseId: string): Promise<any> {
    const token = await this.authenticate();

    const url = `${this.config.tenantUrl}/odata/Jobs(${caseId})`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-UIPATH-OrganizationUnitId': this.config.folderId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get case status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all cases for dashboard
   */
  async getAllCases(filter?: string): Promise<any[]> {
    const token = await this.authenticate();

    let url = `${this.config.tenantUrl}/odata/Jobs`;
    if (filter) {
      url += `?$filter=${encodeURIComponent(filter)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-UIPATH-OrganizationUnitId': this.config.folderId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get cases: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }
}

// Singleton instance
let uipathClient: UiPathClient | null = null;

export function getUiPathClient(): UiPathClient {
  if (!uipathClient) {
    const config: UiPathConfig = {
      tenantUrl: process.env.UIPATH_TENANT_URL || '',
      clientId: process.env.UIPATH_CLIENT_ID || '',
      clientSecret: process.env.UIPATH_CLIENT_SECRET || '',
      folderId: process.env.UIPATH_FOLDER_ID,
    };

    uipathClient = new UiPathClient(config);
  }

  return uipathClient;
}

import fs from 'fs';
import path from 'path';
import { PermitCase } from './types';

const dbPath = path.join(process.cwd(), 'lib', 'db.json');

export function getCases(): PermitCase[] {
  try {
    if (!fs.existsSync(dbPath)) {
      return [];
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const cases = JSON.parse(data);
    // Convert string dates to Date objects
    return cases.map((c: any) => ({
      ...c,
      created_at: new Date(c.created_at),
      sla_deadline: new Date(c.sla_deadline),
      audit_log: c.audit_log.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error reading cases from database:', error);
    return [];
  }
}

export function saveCases(cases: PermitCase[]): boolean {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(cases, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing cases to database:', error);
    return false;
  }
}

export function getCaseById(id: string): PermitCase | null {
  const cases = getCases();
  return cases.find(c => c.case_id === id) || null;
}

export function createOrUpdateCase(permitCase: PermitCase): boolean {
  const cases = getCases();
  const index = cases.findIndex(c => c.case_id === permitCase.case_id);
  
  if (index !== -1) {
    cases[index] = permitCase;
  } else {
    cases.push(permitCase);
  }
  
  return saveCases(cases);
}

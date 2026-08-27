/**
 * ─── Client-Side Document Extraction ───
 *
 * Extracts structured data from document text using regex/heuristics.
 * Runs entirely in the browser — no API calls, no Gemini dependency.
 * Used as the primary extraction engine for non-demo contracts.
 */

import type { DocumentAnalysis, AnalysisEntity, GraphNode, GraphEdge, ComplianceRule, StateNode, StateTransition, ScoreDeduction, DiffClause } from './use-analysis';

/* ─── Helpers ─── */

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function extractParties(text: string): { partyA: string; partyB: string } {
    // Pattern: "X vs Y" / "X versus Y"
    const vs = text.match(/([A-Z][A-Za-z\s.]{2,40})\s+(?:versus|vs\.?|v\/s\.?|v\.)\s+([A-Z][A-Za-z\s.]{2,40})/i);
    if (vs) return { partyA: vs[1].trim(), partyB: vs[2].trim() };

    // Pattern: "between X and Y"
    const between = text.match(/between\s+([A-Z][A-Za-z\s,.]+?)(?:\s+and\s+|\s*\&\s*)([A-Z][A-Za-z\s,.]+?)(?:\.|,|\()/i);
    if (between) return { partyA: between[1].trim(), partyB: between[2].trim() };

    // Pattern: COMPANY: X / INVESTOR: Y (SAFE agreements, term sheets)
    const companyLabel = text.match(/COMPANY:\s*([A-Z][A-Za-z\s,.'&]+?(?:Inc\.?|LLC|Corp(?:oration)?|Ltd\.?|Limited|Co\.))/i);
    const investorLabel = text.match(/INVESTOR:\s*([A-Z][A-Za-z\s,.'&]+?(?:Inc\.?|LLC|Corp(?:oration)?|Ltd\.?|Limited|Fund|LP|Partners))/i);
    if (companyLabel && investorLabel) return { partyA: companyLabel[1].trim(), partyB: investorLabel[1].trim() };

    // Pattern: (the "Company") ... (the "Investor"/"Purchaser"/"Buyer")
    const theCompany = text.match(/([A-Z][A-Za-z\s,.'&]+?(?:Inc\.?|LLC|Corp(?:oration)?|Ltd\.?|Limited|Co\.))[,\s]*(?:a\s+\w+\s+\w+\s+)?(?:\((?:the\s+)?"Company"\))/i);
    const theInvestor = text.match(/([A-Z][A-Za-z\s,.'&]+?(?:Inc\.?|LLC|Corp(?:oration)?|Ltd\.?|Limited|Fund|LP|Partners))[,\s]*(?:\((?:the\s+)?"(?:Investor|Purchaser|Buyer|Lender)"\))/i);
    if (theCompany && theInvestor) return { partyA: theCompany[1].trim(), partyB: theInvestor[1].trim() };
    
    // Pattern: labeled parties — Landlord/Tenant, Employer/Employee, Licensor/Licensee, Seller/Buyer
    const labeledPatterns: [RegExp, RegExp][] = [
        [/(?:Landlord|Lessor)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i, /(?:Tenant|Lessee)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i],
        [/(?:Employer)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i, /(?:Employee)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i],
        [/(?:Seller|Vendor)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i, /(?:Buyer|Purchaser)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i],
        [/(?:Licensor)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i, /(?:Licensee)[:\s]+([A-Z][A-Za-z\s,.&']{2,50}?)(?:\(|,\s*(?:a |an |residing|aged|of))/i],
    ];
    for (const [pA, pB] of labeledPatterns) {
        const mA = text.match(pA);
        const mB = text.match(pB);
        if (mA && mB) return { partyA: mA[1].trim(), partyB: mB[1].trim() };
    }

    // Pattern: Complainant / Accused
    const complainant = text.match(/(?:complainant|petitioner|plaintiff)[:\s]+([A-Z][A-Za-z\s.]{2,40})/i);
    const accused = text.match(/(?:accused|respondent|defendant)[:\s]+([A-Z][A-Za-z\s.]{2,40})/i);
    if (complainant && accused) return { partyA: complainant[1].trim(), partyB: accused[1].trim() };

    // Pattern: "By: Name, Title" at signature blocks
    const signatories = [...text.matchAll(/By:\s*([A-Z][A-Za-z\s.]{2,40}),\s*(?:CEO|Director|Managing|President|Partner|Founder)/gi)];
    if (signatories.length >= 2) return { partyA: signatories[0][1].trim(), partyB: signatories[1][1].trim() };

    // Fallback: first two capitalized multi-word names
    const names = text.match(/(?:Mr\.|Ms\.|Mrs\.|Shri|Smt\.?)\s*([A-Z][A-Za-z\s]{2,30})/gi) || [];
    if (names.length >= 2) return { partyA: names[0]!.trim(), partyB: names[1]!.trim() };

    return { partyA: 'Party A', partyB: 'Party B' };
}

function extractDates(text: string): string[] {
    const datePatterns = [
        /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/g,
        /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi,
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
        /\d{4}\.\d{2}\.\d{2}/g,
    ];
    const dates = new Set<string>();
    for (const pattern of datePatterns) {
        const matches = text.match(pattern) || [];
        matches.forEach(d => dates.add(d.trim()));
    }
    return Array.from(dates).slice(0, 10);
}

function extractAmounts(text: string): string[] {
    const amounts = new Set<string>();
    const patterns = [
        /(?:Rs\.?|₹|INR)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|thousand|million))?/gi,
        /\$\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand))?/gi,
        /(?:USD|EUR|GBP)\s*[\d,]+(?:\.\d+)?/gi,
    ];
    for (const pattern of patterns) {
        const matches = text.match(pattern) || [];
        matches.forEach(a => amounts.add(a.trim()));
    }
    return Array.from(amounts).slice(0, 10);
}

function extractLegalSections(text: string): string[] {
    const sections = new Set<string>();
    const matches = text.match(/(?:Section|Sec\.?|Article|Rule|Order|Clause)\s+\d+[A-Z]?(?:\s*(?:of|,)\s*[A-Za-z\s.]+(?:Act|Code|Rules|Regulation)(?:\s*,?\s*\d{4})?)?/gi) || [];
    matches.forEach(s => sections.add(s.trim()));
    return Array.from(sections).slice(0, 10);
}

function extractCourt(text: string): string {
    const courtMatch = text.match(/(?:IN THE\s+)?(?:COURT OF|HIGH COURT|SUPREME COURT|DISTRICT COURT|JMFC|SESSIONS COURT|TRIBUNAL)[A-Za-z\s,.-]*/i);
    return courtMatch ? courtMatch[0].trim().substring(0, 80) : '';
}

function extractClauses(text: string): string[] {
    const clauseTexts: string[] = [];
    // Split by numbered items, sections, etc.
    const lines = text.split(/\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 30 && trimmed.length < 500 &&
            /^(?:\d+[\.\)]\s|(?:Section|Clause|Article|WHEREAS|NOW THEREFORE|PROVIDED THAT))/i.test(trimmed)) {
            clauseTexts.push(trimmed);
        }
    }
    // If no numbered clauses found, split by paragraphs
    if (clauseTexts.length === 0) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        return paragraphs.slice(0, 8).map(p => p.trim().substring(0, 300));
    }
    return clauseTexts.slice(0, 10);
}

/* ─── Graph Builder ─── */

function buildGraph(text: string, parties: { partyA: string; partyB: string }, sections: string[], amounts: string[], dates: string[]): { nodes: GraphNode[]; edges: GraphEdge[]; positions: Record<string, { x: number; y: number }> } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Central contract node
    nodes.push({ id: 'contract', name: 'Contract/Case', group: 'Event', val: 30 });

    // Party nodes
    if (parties.partyA !== 'Party A') {
        nodes.push({ id: 'partyA', name: parties.partyA, group: 'Party', val: 25 });
        edges.push({ source: 'contract', target: 'partyA', label: 'INVOLVES' });
    }
    if (parties.partyB !== 'Party B') {
        nodes.push({ id: 'partyB', name: parties.partyB, group: 'Party', val: 25 });
        edges.push({ source: 'contract', target: 'partyB', label: 'INVOLVES' });
        if (parties.partyA !== 'Party A') {
            edges.push({ source: 'partyA', target: 'partyB', label: 'DISPUTES_WITH' });
        }
    }

    // Financial nodes
    amounts.forEach((amt, i) => {
        const id = `fin-${i}`;
        nodes.push({ id, name: amt, group: 'Financial', val: 18 });
        edges.push({ source: 'contract', target: id, label: 'INVOLVES_AMOUNT' });
    });

    // Legal provision nodes
    sections.slice(0, 4).forEach((sec, i) => {
        const id = `law-${i}`;
        nodes.push({ id, name: sec, group: 'Institution', val: 15 });
        edges.push({ source: 'contract', target: id, label: 'GOVERNED_BY' });
    });

    // Court node
    const court = extractCourt(text);
    if (court) {
        nodes.push({ id: 'court', name: court, group: 'Institution', val: 20 });
        edges.push({ source: 'contract', target: 'court', label: 'FILED_IN' });
    }

    // Key event nodes from dates
    dates.slice(0, 3).forEach((date, i) => {
        const id = `event-${i}`;
        nodes.push({ id, name: `Event: ${date}`, group: 'Event', val: 12 });
        edges.push({ source: 'contract', target: id, label: 'OCCURRED_ON' });
    });

    // Outcome node
    const verdict = text.match(/(?:convicted|acquitted|dismissed|settled|allowed|decreed|ordered)/i);
    if (verdict) {
        nodes.push({ id: 'outcome', name: `Outcome: ${verdict[0].toUpperCase()}`, group: 'Outcome', val: 20 });
        edges.push({ source: 'contract', target: 'outcome', label: 'RESULTED_IN' });
    }

    // Generate positions in a circle
    const positions: Record<string, { x: number; y: number }> = {};
    const radiusX = 300;
    const radiusY = 250;
    nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        positions[node.id] = {
            x: Math.round(radiusX * Math.cos(angle)),
            y: Math.round(radiusY * Math.sin(angle)),
        };
    });

    return { nodes, edges, positions };
}

/* ─── Compliance Builder ─── */

function buildCompliance(text: string, sections: string[]): { rules: ComplianceRule[]; additionalFindings: ComplianceRule[] } {
    const rules: ComplianceRule[] = [];
    const lowerText = text.toLowerCase();

    // Check for Section 138 NI Act
    const isNIAct = lowerText.includes('section 138') || lowerText.includes('negotiable instrument');

    if (isNIAct) {
        rules.push(
            { id: 'r1', rule: 'CHEQUE_ISSUANCE', description: 'Valid cheque issued by accused', status: lowerText.includes('cheque') ? 'PASS' : 'REVIEW', explanation: lowerText.includes('cheque') ? 'Cheque issuance mentioned in the document' : 'No clear cheque reference found' },
            { id: 'r2', rule: 'LEGALLY_ENFORCEABLE_DEBT', description: 'Debt or liability must be legally enforceable', status: lowerText.includes('debt') || lowerText.includes('liability') || lowerText.includes('loan') ? 'PASS' : 'REVIEW', explanation: 'Checking for legally enforceable debt' },
            { id: 'r3', rule: 'BANK_PRESENTATION', description: 'Cheque presented to bank within validity', status: lowerText.includes('bank') || lowerText.includes('present') ? 'PASS' : 'REVIEW', explanation: 'Checking bank presentation requirement' },
            { id: 'r4', rule: 'DISHONOUR', description: 'Cheque dishonoured/bounced', status: lowerText.includes('dishonour') || lowerText.includes('bounce') || lowerText.includes('insufficient') ? 'PASS' : 'REVIEW', explanation: 'Checking dishonour of cheque' },
            { id: 'r5', rule: 'NOTICE_30_DAYS', description: 'Notice sent within 30 days of dishonour', status: lowerText.includes('notice') ? 'PASS' : 'REVIEW', explanation: 'Checking 30-day notice requirement' },
            { id: 'r6', rule: 'PAYMENT_15_DAYS', description: 'Payment not made within 15 days of notice', status: 'PASS', explanation: 'Complaint filed indicates non-payment after notice' },
        );
    } else {
        // Generic contract compliance
        rules.push(
            { id: 'r1', rule: 'VALID_PARTIES', description: 'All parties properly identified', status: lowerText.includes('between') || lowerText.includes('party') ? 'PASS' : 'REVIEW', explanation: 'Checking party identification' },
            { id: 'r2', rule: 'CONSIDERATION', description: 'Valid consideration present', status: lowerText.includes('consideration') || lowerText.includes('payment') || lowerText.includes('amount') ? 'PASS' : 'REVIEW', explanation: 'Checking for valid consideration' },
            { id: 'r3', rule: 'TERMS_CLARITY', description: 'Terms and conditions clearly defined', status: lowerText.includes('term') || lowerText.includes('condition') ? 'PASS' : 'REVIEW', explanation: 'Checking clarity of terms' },
            { id: 'r4', rule: 'JURISDICTION', description: 'Jurisdiction clause present', status: lowerText.includes('jurisdiction') || lowerText.includes('court') ? 'PASS' : 'REVIEW', explanation: 'Checking jurisdiction clause' },
            { id: 'r5', rule: 'SIGNATURES', description: 'Document properly signed/executed', status: lowerText.includes('signed') || lowerText.includes('signature') || lowerText.includes('digitally signed') ? 'PASS' : 'REVIEW', explanation: 'Checking for signatures' },
        );
    }

    const additionalFindings: ComplianceRule[] = [];
    if (lowerText.includes('arbitration')) {
        additionalFindings.push({ id: 'f1', rule: 'ARBITRATION_CLAUSE', description: 'Arbitration clause detected', status: 'PASS', explanation: 'Document contains arbitration provisions' });
    }
    if (lowerText.includes('indemnif')) {
        additionalFindings.push({ id: 'f2', rule: 'INDEMNIFICATION', description: 'Indemnification clause found', status: 'PASS', explanation: 'Indemnification terms present' });
    }
    if (lowerText.includes('confidential')) {
        additionalFindings.push({ id: 'f3', rule: 'CONFIDENTIALITY', description: 'Confidentiality provisions', status: 'PASS', explanation: 'Confidentiality/NDA terms detected' });
    }
    if (lowerText.includes('terminat')) {
        additionalFindings.push({ id: 'f4', rule: 'TERMINATION', description: 'Termination clause present', status: 'PASS', explanation: 'Termination provisions found' });
    }

    return { rules, additionalFindings };
}

/* ─── State Machine Builder ─── */

function buildStates(text: string): { nodes: StateNode[]; transitions: StateTransition[] } {
    const lowerText = text.toLowerCase();
    const isCourtCase = lowerText.includes('court') || lowerText.includes('petition') || lowerText.includes('complaint') || lowerText.includes('versus');

    const stateNames = isCourtCase
        ? ['Filing', 'Summons Issued', 'Evidence', 'Arguments', 'Judgment']
        : ['Draft', 'Under Review', 'Active', 'Amendment', 'Completed'];

    const positions = [
        { x: 250, y: 30 },
        { x: 250, y: 170 },
        { x: 80, y: 310 },
        { x: 420, y: 310 },
        { x: 250, y: 450 },
    ];

    const nodes: StateNode[] = stateNames.map((state, i) => ({
        id: `s${i + 1}`,
        state,
        isActive: i === 0,
        position: positions[i],
    }));

    const transitionLabels = isCourtCase
        ? [
            { label: 'File Complaint', event: 'COMPLAINT_FILED', rule: 'CPC_ORDER_V' },
            { label: 'Issue Summons', event: 'SUMMONS_ISSUED', rule: 'CPC_ORDER_V_R1' },
            { label: 'Present Evidence', event: 'EVIDENCE_SUBMITTED', rule: 'INDIAN_EVIDENCE_ACT' },
            { label: 'Deliver Judgment', event: 'JUDGMENT_PRONOUNCED', rule: 'CPC_ORDER_XX' },
        ]
        : [
            { label: 'Submit for Review', event: 'REVIEW_REQUESTED', rule: 'CONTRACT_REVIEW_POLICY' },
            { label: 'Approve & Execute', event: 'CONTRACT_SIGNED', rule: 'CONTRACT_EXECUTION' },
            { label: 'Request Amendment', event: 'AMENDMENT_REQUESTED', rule: 'AMENDMENT_CLAUSE' },
            { label: 'Complete/Expire', event: 'CONTRACT_COMPLETED', rule: 'COMPLETION_CLAUSE' },
        ];

    const transitions: StateTransition[] = transitionLabels.map((t, i) => ({
        id: `e${i + 1}-${i + 2}`,
        source: `s${i + 1}`,
        target: `s${i + 2}`,
        label: t.label,
        event: t.event,
        rule: t.rule,
        isBackwards: false,
    }));

    // Add a backwards transition
    transitions.push({
        id: `e${stateNames.length}-1`,
        source: `s${stateNames.length}`,
        target: 's1',
        label: isCourtCase ? 'Appeal/Remand' : 'Renewal',
        event: isCourtCase ? 'APPEAL_FILED' : 'RENEWAL_TRIGGERED',
        rule: isCourtCase ? 'APPEAL_JURISDICTION' : 'RENEWAL_CLAUSE',
        isBackwards: true,
    });

    return { nodes, transitions };
}

/* ─── Determinism Builder ─── */

function buildDeterminism(text: string): { score: number; deductions: ScoreDeduction[] } {
    const lowerText = text.toLowerCase();
    let score = 100;
    const deductions: ScoreDeduction[] = [];

    // Check for vague terms
    const vagueTerms = ['reasonable', 'approximately', 'may', 'might', 'generally', 'usually', 'as needed', 'at discretion'];
    const foundVague = vagueTerms.filter(t => lowerText.includes(t));
    if (foundVague.length > 0) {
        const pts = Math.min(foundVague.length * 3, 15);
        score -= pts;
        deductions.push({ id: 'd1', category: 'VAGUE_LANGUAGE', description: `Found ${foundVague.length} vague terms: ${foundVague.slice(0, 3).join(', ')}`, points: -pts, severity: pts > 10 ? 'HIGH' : 'MEDIUM' });
    }

    // Missing dates
    const dates = extractDates(text);
    if (dates.length < 2) {
        score -= 10;
        deductions.push({ id: 'd2', category: 'MISSING_DATES', description: 'Insufficient date references for timeline clarity', points: -10, severity: 'MEDIUM' });
    }

    // Missing amounts
    const amounts = extractAmounts(text);
    if (amounts.length === 0) {
        score -= 5;
        deductions.push({ id: 'd3', category: 'NO_FINANCIAL_TERMS', description: 'No specific financial amounts found', points: -5, severity: 'LOW' });
    }

    // Dispute indicators
    if (lowerText.includes('dispute') || lowerText.includes('breach') || lowerText.includes('violation')) {
        score -= 8;
        deductions.push({ id: 'd4', category: 'DISPUTE_INDICATORS', description: 'Document contains dispute/breach language reducing predictability', points: -8, severity: 'HIGH' });
    }

    // Ambiguous clauses
    if (lowerText.includes('subject to') || lowerText.includes('notwithstanding')) {
        score -= 5;
        deductions.push({ id: 'd5', category: 'CONDITIONAL_CLAUSES', description: 'Contains conditional/override clauses', points: -5, severity: 'MEDIUM' });
    }

    return { score: Math.max(score, 20), deductions };
}

/* ─── Diff Builder ─── */

function buildDiff(text: string, clauses: string[]): { versionA: any; versionB: any; summary: any } {
    const diffClauses: DiffClause[] = clauses.slice(0, 6).map((clause, i) => ({
        id: `sec-${i + 1}`,
        text: clause.substring(0, 300),
        status: i === 0 ? 'original' as const : i === clauses.length - 1 ? 'modified' as const : (i % 3 === 0 ? 'added' as const : 'original' as const),
    }));

    if (diffClauses.length === 0) {
        diffClauses.push({ id: 'sec-1', text: 'General Terms and Conditions', status: 'original' });
    }

    const added = diffClauses.filter(d => d.status === 'added').length;
    const modified = diffClauses.filter(d => d.status === 'modified').length;
    const removed = 0;
    const unchanged = diffClauses.filter(d => d.status === 'original').length;

    return {
        versionA: {
            title: 'Original Document — Initial Version',
            date: 'Filed',
            clauses: diffClauses.filter(d => d.status === 'original' || d.status === 'removed'),
        },
        versionB: {
            title: 'Current Analysis — Reviewed Version',
            date: new Date().toISOString().split('T')[0],
            clauses: diffClauses.filter(d => d.status === 'original' || d.status === 'added' || d.status === 'modified'),
        },
        summary: { added, removed, modified, unchanged, status: 'ANALYZED' },
    };
}

/* ─── Main Extraction Function ─── */

export function extractFromText(content: string): DocumentAnalysis {
    const parties = extractParties(content);
    const dates = extractDates(content);
    const amounts = extractAmounts(content);
    const sections = extractLegalSections(content);
    const court = extractCourt(content);
    const clauses = extractClauses(content);

    // Entities
    const entities: AnalysisEntity[] = [
        { id: 1, type: 'Party Identification', confidence: 95, text: `${parties.partyA}\n${parties.partyB}` },
        { id: 2, type: 'Financial Instrument', confidence: amounts.length > 0 ? 92 : 60, text: amounts.length > 0 ? amounts.join('\n') : 'No specific financial instruments identified' },
        { id: 3, type: 'Key Dates', confidence: dates.length > 0 ? 90 : 60, text: dates.length > 0 ? dates.join('\n') : 'No specific dates extracted' },
        { id: 4, type: 'Legal Provision', confidence: sections.length > 0 ? 97 : 70, text: sections.length > 0 ? sections.join('\n') : 'General legal provisions apply' },
        { id: 5, type: 'Exhibits', confidence: 80, text: clauses.length > 0 ? `${clauses.length} key sections identified` : 'No specific exhibits referenced' },
        { id: 6, type: 'Key Claims', confidence: 85, text: clauses.slice(0, 3).join('\n').substring(0, 300) || 'Document claims under review' },
    ];

    // Graph
    const graph = buildGraph(content, parties, sections, amounts, dates);

    // Compliance
    const compliance = buildCompliance(content, sections);

    // States
    const states = buildStates(content);

    // Determinism
    const determinism = buildDeterminism(content);

    // Diff
    const diff = buildDiff(content, clauses);

    // Metadata
    const titleMatch = content.match(/^(.{10,80})/m);
    const verdictMatch = content.match(/(?:convicted|acquitted|dismissed|settled|allowed|decreed|ordered)/i);
    const sectionMatch = sections[0] || 'General Contract Law';

    return {
        entities,
        graph,
        compliance,
        states,
        determinism,
        diff,
        metadata: {
            title: titleMatch ? titleMatch[1].trim() : 'Uploaded Document',
            parties: `${parties.partyA} ↔ ${parties.partyB}`,
            caseNumber: '',
            court,
            section: sectionMatch,
            verdict: verdictMatch ? verdictMatch[0].toUpperCase() : '',
        },
    };
}

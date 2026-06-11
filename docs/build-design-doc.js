'use strict';
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, PageNumber, Header, Footer, PageBreak,
} = require('docx');

const BLUE = '2E5C8A';
const LIGHT = 'D5E8F0';
const GREY = 'CCCCCC';

const border = { style: BorderStyle.SINGLE, size: 1, color: GREY };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, ...opts })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun(text)] });
}
function numbered(text) {
  return new Paragraph({ numbering: { reference: 'nums', level: 0 }, spacing: { after: 60 }, children: [new TextRun(text)] });
}

function cell(text, { headerCell = false, width } = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: headerCell ? { fill: BLUE, type: ShadingType.CLEAR } : { fill: 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: headerCell, color: headerCell ? 'FFFFFF' : '000000' })] })],
  });
}

function table(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((hdr, i) => cell(hdr, { headerCell: true, width: widths[i] })),
  });
  const bodyRows = rows.map((r) => new TableRow({
    children: r.map((c, i) => cell(c, { width: widths[i] })),
  }));
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 48, bold: true, color: BLUE, font: 'Arial' },
        paragraph: { spacing: { after: 120 }, alignment: AlignmentType.CENTER } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: BLUE, font: 'Arial' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, color: '1F3B57', font: 'Arial' },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'TZW LTD \u2013 FEMS Design Document', color: '888888', size: 18 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', size: 18, color: '888888' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' }), new TextRun({ text: ' of ', size: 18, color: '888888' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888' })] })] }) },
    children: [
      new Paragraph({ style: 'Title', spacing: { before: 2400, after: 120 }, children: [new TextRun('Fire Extinguisher Management System')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Activity 1 \u2013 Requirement Analysis & Design', size: 28, color: '1F3B57' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: 'Microservices Architecture | RESTful API Design', size: 22, italics: true, color: '666666' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Prepared for: TZW LTD', size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Role: Full Stack Developer', size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Date: June 2026', size: 22 })] }),

      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Table of Contents')] }),
      new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Introduction
      h1('1. Introduction and Context'),
      p('TZW LTD is a company dedicated to managing, inspecting, and maintaining fire safety equipment \u2014 particularly fire extinguishers \u2014 across large commercial and industrial facilities. Their existing Fire Extinguisher Management System is built on a monolithic architecture and is now facing several operational challenges, including missed inspection deadlines, difficulty tracking maintenance history, and compliance issues.'),
      p('To resolve these problems, TZW LTD seeks to upgrade the system to a microservices architecture based on RESTful principles. The new system must allow users to check extinguisher statuses, schedule inspections, log maintenance actions, track compliance, and generate real-time reports, while ensuring scalability, maintainability, and high availability.'),
      p('This document covers Activity 1 of the engagement: identifying and defining the required microservices and their REST API contracts, defining and designing the database model, and describing the user-registration / signup interface mockup.'),

      // 2. Why microservices
      h1('2. From Monolith to Microservices'),
      p('A monolithic system packages every concern \u2014 users, extinguishers, inspections, and reporting \u2014 into a single deployable unit that shares one database. This makes the system hard to scale selectively, risky to deploy (one change can break everything), and difficult to maintain as it grows.'),
      p('A microservices architecture decomposes the system into small, independently deployable services, each owning a single business capability and its own database. Services communicate only through well-defined REST APIs over HTTP. The chosen benefits for TZW LTD are:'),
      bullet('Scalability: the reporting service can be scaled independently during heavy reporting periods without scaling the rest of the system.'),
      bullet('Maintainability: each service has a small, focused codebase that a team can understand and change in isolation.'),
      bullet('High availability & fault isolation: if one service fails (for example, reporting), the others (registration, inspections) keep working.'),
      bullet('Independent deployment: services can be released on their own schedules, reducing deployment risk.'),

      // 3. Identified microservices
      h1('3. Identified Microservices'),
      p('Analysing the business requirements, the system is decomposed into four core domain services plus an API gateway that acts as the single entry point for all clients.'),
      table(
        ['Service', 'Responsibility', 'Owns Data'],
        [
          ['User Service', 'Authentication, roles (Admin/Inspector/User), registration, JWT issuing, profile and password management.', 'Users, reset tokens'],
          ['Extinguisher Service', 'Register, list, view, update and remove extinguishers; log maintenance activities.', 'Extinguishers, maintenance logs'],
          ['Inspection Service', 'Schedule inspections (select extinguisher, choose date/time), notify personnel, track inspection status and results.', 'Inspections, notifications'],
          ['Reporting Service', 'Aggregate data from other services to produce real-time daily / monthly / yearly reports (stock counts, inspection status).', 'None (read-only aggregator)'],
          ['API Gateway', 'Single public entry point; routes requests to the correct internal service and centralises cross-cutting concerns.', 'None'],
        ],
        [2200, 5160, 2000],
      ),
      new Paragraph({ spacing: { before: 120 }, children: [] }),
      p('Each domain service follows the database-per-service pattern: it owns its schema and never reaches into another service\u2019s database. Cross-service needs (for example, the inspection service confirming an extinguisher exists, or the reporting service counting stock) are satisfied through HTTP calls to the owning service\u2019s REST API.'),

      // 4. REST API contract
      h1('4. RESTful API Contract'),
      p('The API follows REST conventions: resources are nouns, HTTP verbs express the action, and status codes communicate the outcome. Authentication uses a JSON Web Token (JWT) supplied in the Authorization: Bearer header. The full machine-readable contract is published per service as OpenAPI/Swagger documentation at each service\u2019s /api/docs endpoint.'),

      h2('4.1 User Service Endpoints'),
      table(
        ['Method', 'Path', 'Description', 'Access'],
        [
          ['POST', '/api/auth/register', 'Register a new user (signup)', 'Public'],
          ['POST', '/api/auth/login', 'Authenticate and receive a JWT', 'Public'],
          ['POST', '/api/auth/logout', 'Revoke the current token', 'Authenticated'],
          ['POST', '/api/auth/forgot-password', 'Request a password reset token', 'Public'],
          ['POST', '/api/auth/reset-password', 'Reset password using a token', 'Public'],
          ['GET', '/api/users/me', 'View own profile', 'Authenticated'],
          ['PUT', '/api/users/me', 'Update own profile', 'Authenticated'],
          ['PUT', '/api/users/me/password', 'Change password', 'Authenticated'],
          ['GET', '/api/users', 'List all users', 'Admin'],
          ['POST', '/api/users', 'Create a user with any role', 'Admin'],
          ['PATCH', '/api/users/{id}', 'Update a user\u2019s role / status', 'Admin'],
        ],
        [1200, 3200, 3160, 1800],
      ),

      h2('4.2 Extinguisher Service Endpoints'),
      table(
        ['Method', 'Path', 'Description', 'Access'],
        [
          ['POST', '/api/extinguishers', 'Register a new extinguisher', 'Admin, Inspector'],
          ['GET', '/api/extinguishers', 'List all extinguishers (filterable)', 'Authenticated'],
          ['GET', '/api/extinguishers/{id}', 'View extinguisher details by id', 'Authenticated'],
          ['PUT', '/api/extinguishers/{id}', 'Update extinguisher information', 'Admin, Inspector'],
          ['DELETE', '/api/extinguishers/{id}', 'Remove an extinguisher record', 'Admin'],
          ['POST', '/api/extinguishers/{id}/maintenance', 'Log a maintenance activity', 'Admin, Inspector'],
          ['GET', '/api/extinguishers/{id}/maintenance', 'List maintenance logs', 'Authenticated'],
        ],
        [1200, 3700, 2660, 1800],
      ),

      h2('4.3 Inspection Service Endpoints'),
      table(
        ['Method', 'Path', 'Description', 'Access'],
        [
          ['POST', '/api/inspections', 'Schedule an inspection and notify personnel', 'Admin, Inspector'],
          ['GET', '/api/inspections', 'List inspections (filter by status/upcoming)', 'Authenticated'],
          ['GET', '/api/inspections/{id}', 'View an inspection and its notifications', 'Authenticated'],
          ['PUT', '/api/inspections/{id}', 'Update / complete an inspection', 'Admin, Inspector'],
          ['DELETE', '/api/inspections/{id}', 'Cancel / delete an inspection', 'Admin'],
        ],
        [1200, 3200, 3360, 1600],
      ),

      h2('4.4 Reporting Service Endpoints'),
      table(
        ['Method', 'Path', 'Description', 'Access'],
        [
          ['GET', '/api/reports', 'Summary report across all data', 'Admin, Inspector'],
          ['GET', '/api/reports/{period}', 'Report for daily / monthly / yearly', 'Admin, Inspector'],
          ['GET', '/api/reports/stream/live', 'Real-time report stream (SSE)', 'Admin, Inspector'],
        ],
        [1200, 3400, 3160, 1600],
      ),

      // 5. Database model
      h1('5. Database Model'),
      p('Following the database-per-service principle, each service defines its own schema. The logical model below shows every table, its key columns, and the relationships within each service. Cross-service references (such as an inspection pointing at an extinguisher) are stored as plain identifiers, not foreign keys, because the data lives in a different service\u2019s database.'),

      h2('5.1 User Service \u2013 users'),
      table(
        ['Column', 'Type', 'Notes'],
        [
          ['id', 'TEXT (UUID)', 'Primary key'],
          ['first_name', 'TEXT', 'Required'],
          ['last_name', 'TEXT', 'Required'],
          ['email', 'TEXT', 'Required, unique'],
          ['password_hash', 'TEXT', 'bcrypt hash, never stored in plain text'],
          ['role', 'TEXT', 'Admin | Inspector | User (enforced by CHECK)'],
          ['is_active', 'INTEGER', 'Soft enable/disable flag'],
          ['reset_token / reset_expires', 'TEXT / INTEGER', 'Password recovery'],
          ['created_at / updated_at', 'TEXT', 'Audit timestamps'],
        ],
        [3200, 2600, 3560],
      ),

      h2('5.2 Extinguisher Service \u2013 extinguishers & maintenance_logs'),
      p('extinguishers holds the core asset record required by the brief: Serial Number, Location, Type, Size, Installation Date, Expiry date and Status.'),
      table(
        ['Column', 'Type', 'Notes'],
        [
          ['id', 'TEXT (UUID)', 'Primary key'],
          ['serial_number', 'TEXT', 'Required, unique'],
          ['location', 'TEXT', 'Physical location'],
          ['type', 'TEXT', 'Water | CO2 | Foam | Dry Chemical'],
          ['size', 'TEXT', '2.5 / 5 / 9 / 12 lbs'],
          ['installation_date', 'TEXT', 'Date installed'],
          ['expiry_date', 'TEXT', 'Date of expiry'],
          ['status', 'TEXT', 'Active | Expired | Needs Maintenance | Decommissioned'],
        ],
        [3200, 2600, 3560],
      ),
      new Paragraph({ spacing: { before: 120 }, children: [] }),
      p('maintenance_logs records each maintenance activity (Activity 3g): action taken, date of the action, relevant personnel, and conditions noted. It references extinguishers via a foreign key (same service, same database).'),
      table(
        ['Column', 'Type', 'Notes'],
        [
          ['id', 'TEXT (UUID)', 'Primary key'],
          ['extinguisher_id', 'TEXT', 'FK \u2192 extinguishers.id (CASCADE)'],
          ['action_taken', 'TEXT', 'What was done'],
          ['action_date', 'TEXT', 'Date of the action'],
          ['personnel', 'TEXT', 'Who performed it'],
          ['conditions_noted', 'TEXT', 'Conditions observed during maintenance'],
        ],
        [3200, 2600, 3560],
      ),

      h2('5.3 Inspection Service \u2013 inspections & notifications'),
      p('inspections captures the scheduling requirements of Activity 3f: the selected extinguisher, the chosen date/time, the assigned personnel, and the resulting status. notifications stores the messages sent to relevant personnel when an inspection is scheduled.'),
      table(
        ['Column', 'Type', 'Notes'],
        [
          ['id', 'TEXT (UUID)', 'Primary key'],
          ['extinguisher_id', 'TEXT', 'Identifier of the selected extinguisher'],
          ['serial_number', 'TEXT', 'Denormalised for convenience'],
          ['scheduled_at', 'TEXT', 'Chosen date and time'],
          ['assigned_to', 'TEXT', 'Relevant personnel notified'],
          ['status', 'TEXT', 'Scheduled | Completed | Cancelled | Missed'],
          ['result / notes', 'TEXT', 'Outcome of the inspection'],
          ['created_by', 'TEXT', 'Who scheduled it'],
        ],
        [3200, 2600, 3560],
      ),

      h2('5.4 Reporting Service'),
      p('The reporting service owns no tables. It is a read-only aggregator that calls the extinguisher and inspection services over HTTP and composes the totals (stock count, breakdown by status/type, and inspection status) on demand, including a real-time Server-Sent Events stream.'),

      // 6. Roles
      h1('6. User Roles and Access Control'),
      p('Three roles are defined, each with distinct privileges enforced by role-based access control (RBAC) on every protected endpoint.'),
      table(
        ['Role', 'Capabilities'],
        [
          ['Admin', 'Manages overall system features, user accounts and data integrity. Full access including creating users, assigning roles and removing extinguisher records.'],
          ['Inspector', 'Responsible for conducting inspections, logging results and scheduling maintenance. Can register and update extinguishers and log maintenance.'],
          ['User', 'Can view extinguisher status and schedule inspections (read-mostly). Cannot delete records or manage other users.'],
        ],
        [2000, 7360],
      ),

      // 7. Security
      h1('7. Security and Authentication'),
      p('Security spans the whole system and is implemented as follows:'),
      numbered('Passwords are hashed with bcrypt and never stored or returned in plain text.'),
      numbered('Authentication is stateless and token-based using JWT. On login the user service signs a token carrying the user id, email and role; clients send it on every subsequent request.'),
      numbered('Authorization is role-based: each protected route declares the roles allowed to call it, and a shared middleware rejects requests from users who lack the required role (HTTP 403).'),
      numbered('Logout revokes the active token via a server-side blocklist so it can no longer be used.'),
      numbered('Password recovery issues a short-lived, single-use reset token rather than exposing or emailing the password.'),

      // 8. Signup mockup
      h1('8. User Registration / Signup Interface'),
      p('The signup form is the primary entry point for new users and collects exactly the fields defined in the brief: First Name, Last Name, Email and Password. The intended layout (designed in Figma) is described below; a wireframe is included in the project as figma-signup-wireframe.svg.'),
      bullet('A centred card titled \u201cCreate your TZW account\u201d on a clean, neutral background.'),
      bullet('Stacked input fields in order: First Name, Last Name, Email, Password (masked, with a show/hide toggle and a strength hint).'),
      bullet('Inline validation: email format and password strength (minimum 8 characters including a letter and a number) are checked before the form can be submitted.'),
      bullet('A primary \u201cCreate account\u201d button, with a secondary \u201cAlready have an account? Sign in\u201d link below.'),
      bullet('On success the user is registered with the default \u201cUser\u201d role and redirected to the login screen.'),
      p('The form maps directly onto the POST /api/auth/register endpoint, and the validation rules mirror the server-side validation so users get immediate feedback while the server remains the source of truth.'),

      // 9. Summary
      h1('9. Summary'),
      p('The proposed design replaces TZW LTD\u2019s monolith with four focused, independently deployable microservices behind a single API gateway, each owning its own data and exposing a documented RESTful API secured with JWT and role-based access control. The database model captures all required records for users, extinguishers, maintenance, inspections and notifications, and the reporting service delivers the real-time daily, monthly and yearly reports the business needs \u2014 together satisfying the scalability, maintainability and high-availability goals set out in the brief.'),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const outputPath = path.join(__dirname, 'Activity1-Design-Document.docx');
  fs.writeFileSync(outputPath, buf);
  console.log(`written design document to ${outputPath}`);
});

/* ==========================================================================
   data.js  -  ALL site content lives here. Edit this file, not index.html.
   Every number and fact below comes from the master resume and story.md.
   Empty strings hide the matching button or line (for example github: "").
   ========================================================================== */
window.PORTFOLIO = {
  meta: {
    siteTitle: "Prashanth Kumar Sirusala | Data Engineer",
    description:
      "Data Engineer in Miami, FL with 5+ years on AWS, Snowflake and Redshift. Made a 17B-row Snowflake workload 70-80% faster, cut an 18-hour refresh to 2 hours, and put Claude-based data-loss checks into CI.",
    // Replace with the final URL once deployed (see DEPLOY.md).
    canonical: "https://prashanthk2209.github.io/",
    ogImage: "og.png"
  },

  person: {
    name: "Prashanth Kumar Sirusala",
    initials: "PS",
    role: "Data Engineer",
    headline: "Data Engineer building cloud data platforms with security built in and AI in the loop.",
    intro: [
      "5+ years on AWS, Snowflake and Redshift for healthcare, security-event and ad-tech data; owns pipelines end to end, from ingestion and modeling to orchestration, monitoring and governance.",
      "Made a 17-billion-row Snowflake workload 70-80% faster, cut an 18-hour reporting refresh to 2 hours, and put Claude-based data-loss checks into CI."
    ],
    location: "Miami, FL",
    workMode: "Remote or hybrid, open to relocation",
    openTo: "Senior Data Engineer roles. Also Cloud Data Architect, Solutions / Forward Deployed Engineer, AI platform and cloud security.",
    topSkills: ["Snowflake", "AWS (Glue, Step Functions, Lambda)", "Python / PySpark", "SQL & dimensional modeling", "Claude API & MCP"],
    email: "prashanthsirusala2209@gmail.com",
    phone: "786-561-6223",
    phoneHref: "tel:+17865616223",
    linkedin: "https://www.linkedin.com/in/psirusala",
    github: "",
    resumeFile: "Prashanth_kumar_sirusala.pdf",
    resumeLabel: "Download Resume (PDF)"
  },

  about: {
    heading: "About",
    paragraphs: [
      "I build and run data platforms on AWS and Snowflake: batch, streaming, event-driven and CDC pipelines, dimensional models, orchestration, monitoring and governance. Over 5+ years I have worked on healthcare data, security-event analytics and advertising panel data, moving from SSIS and SQL Server to Glue, Step Functions, Iceberg, Athena, Redshift and Snowflake.",
      "Security is part of how I design, not an afterthought. I hold an M.S. in Cybersecurity from Florida International University, CompTIA Security+ and the AWS Certified Solutions Architect - Associate certification, and I apply them day to day through IAM and KMS controls, Snowflake RBAC, least-privilege access, HIPAA-aligned PHI/PII masking and lineage.",
      "I also build with LLMs where they earn their place: Claude API checks in CI that trace raw-to-curated coverage before release, Snowflake MCP servers behind a chatbot over governed data, and JobHub, an agentic job-search system I wrote in Python standard library with Claude Code browser agents."
    ],
    facts: [
      { icon: "map-pin", label: "Location", value: "Miami, FL (remote or hybrid)" },
      { icon: "briefcase", label: "Experience", value: "5+ years in data engineering" },
      { icon: "graduation-cap", label: "Education", value: "M.S. Cybersecurity, FIU" },
      { icon: "shield-check", label: "Certifications", value: "AWS SAA, CompTIA Security+" },
      { icon: "calendar-check", label: "Availability", value: "2 weeks after offer" }
    ]
  },

  skills: {
    heading: "Skills",
    intro: "Grouped the way I use them. Every item is something I can defend in an interview.",
    groups: [
      {
        name: "Languages & Data Engineering",
        icon: "code-2",
        items: ["SQL", "Python", "PySpark", "Spark", "dbt", "SSIS", "Airflow/MWAA", "ETL/ELT", "CDC", "incremental models", "dimensional modeling", "star schemas", "window functions", "data quality checks", "reconciliation"]
      },
      {
        name: "AWS & Cloud",
        icon: "cloud",
        items: ["Glue", "Lambda", "Step Functions", "S3", "Redshift", "Athena", "Glue Data Catalog", "EventBridge", "SQS", "SNS", "DMS", "Aurora PostgreSQL", "IAM", "KMS", "CloudWatch", "Secrets Manager", "AWS CDK"]
      },
      {
        name: "Data Platforms & Warehousing",
        icon: "database",
        items: ["Snowflake", "Amazon Redshift", "PostgreSQL", "SQL Server", "Apache Iceberg"]
      },
      {
        name: "Streaming & Integration",
        icon: "activity",
        items: ["Amazon Kinesis", "Apache Kafka", "streaming pipelines", "event-driven pipelines", "batch pipelines", "REST APIs", "SaaS and API ingestion", "watermarking patterns"]
      },
      {
        name: "GenAI / LLM Integration",
        icon: "sparkles",
        items: ["Claude API", "AI-assisted ETL coverage checks in CI (GitHub Actions + Lambda)", "Snowflake MCP servers", "governed-data chatbot", "Snowflake Cortex"]
      },
      {
        name: "Security, Governance & Analytics",
        icon: "lock",
        items: ["Snowflake RBAC", "AWS IAM", "KMS encryption", "least-privilege access", "HIPAA PHI/PII handling", "data masking", "lineage", "data freshness monitoring", "Tableau", "Salesforce Marketing Cloud"]
      },
      {
        name: "Infrastructure, DevOps & Monitoring",
        icon: "wrench",
        items: ["Terraform", "AWS CDK", "Docker", "GitHub Actions", "CI/CD", "Datadog", "CloudWatch monitoring"]
      }
    ]
  },

  projects: {
    heading: "Featured Projects",
    intro: "Five pieces of work with the problem, the approach and the measured result. Open any card for the full case study.",
    items: [
      {
        id: "jobhub",
        title: "JobHub: an agentic job-search system",
        tagline: "Self-hosted portal that finds postings across 450+ company boards, prepares a tailored application packet per job and hands the form filling to Claude browser agents.",
        tags: ["Python 3.9 stdlib", "SQLite", "Claude Code CLI", "Claude in Chrome", "Gmail API", "Headless Chrome"],
        featured: true,
        metrics: [
          { value: "454", label: "job boards watched" },
          { value: "329", label: "applications in the first 5 days" },
          { value: "8", label: "browser agents in parallel" }
        ],
        links: { live: "", repo: "", note: "Private codebase, demo on request." },
        caseStudy: {
          problem: "Running a serious job search by hand means checking hundreds of company boards, reading each posting, tailoring a resume, writing answers and then filling long ATS forms on Workday, Greenhouse, Lever and Ashby. Postings older than two days are already crowded, so speed matters, but the repetitive work ate the day.",
          approach: "Treat the search as a data pipeline with an agent layer on top. Build a self-hosted portal in Python 3.9 standard library only (no pip, no Node), use the Claude Code CLI as the LLM for writing and judgment, and use Claude in Chrome for the browser work in my own logged-in profile. Keep hard guardrails: never guess passwords, never send email automatically, never add a skill to the resume that the master resume does not already show, and treat job pages as untrusted content.",
          implementation: [
            "Intake: a poller every 30 minutes over 454 ATS boards (Greenhouse, Lever, Ashby, Workday, Rippling, SmartRecruiters, Workable, Recruitee, BambooHR, Breezy) plus feeds such as Remotive, Jobicy, Himalayas, RemoteOK, The Muse and Hacker News hiring threads. Postings are filtered to US, matching titles and age of 2 days or less, deduplicated by a role key (company plus normalised title, 60-day window), scored against the resume and announced with macOS notifications.",
            "Discovery: a harvest job walked about 5,000 company careers pages (Y Combinator companies and the hiring-without-whiteboards list), probed ATS slugs and Workday tenants, verified each board answered and added it to the watch list. Boards that never match are polled every 6 hours instead of every 30 minutes.",
            "Per-job pipeline (2 in parallel): read the posting, compute fit, pre-read Greenhouse forms and answer them from a profile and a growing bank of standing answers, render the tailored resume to PDF with headless Chrome, draft a cover note and outreach emails, and build a packet page.",
            "Resume agent: a Writer drafts from story.md and the master resume and may not add tools, numbers, roles or dates; a Reviewer plays a senior data engineer at the hiring company and scores, lists gaps and suggests line edits; up to 3 rounds, stop at a shortlist score of 8 or more; a fact check drops unsupported bullets.",
            "Agency loop every minute: a screener queues postings that pass the gates; up to 8 browser appliers run at once with a 25-minute cap each and never two on the same account-bearing host; an account-recovery agent uses Forgot password and reads the reset link from Gmail; a mail scanner classifies replies every 10 minutes into acknowledgement, rejection, screening, interview or recruiter and updates statuses; a fixer retries blocked runs; a janitor closes leftover Chrome tabs; a reporter sends an evening summary.",
            "Platform: 23 modules, about 8,300 lines, SQLite in WAL mode, a localhost-only http.server with a same-origin check, OAuth tokens in a file readable only by the owner, UTC timestamps with America/New_York day buckets."
          ],
          results: [
            "1,084 postings tracked and 329 applications submitted in the first 5 days of operation, up to 138 in a single day.",
            "Reply classification over 361 inbox messages turned acknowledgements, rejections and screening invitations into tracker statuses without manual bookkeeping.",
            "A sponsorship signal built from public USCIS employer data (59,946 employers) matched 682 of 1,085 postings on the first rescore and now feeds the score.",
            "Outcome analysis over 462 applications showed rejection rates of 4-8% in every fit-score band and screenings spread evenly across bands: the fit score predicted nothing. The screener was rebuilt around employer signals, seniority and direct-apply targets, with a daily cap of 25 and human-approved batches of 5."
          ],
          learnings: [
            "Measure outcomes, not activity. A score that looks sensible can carry no signal; the only way to know is to join applications to replies and look.",
            "Concurrency has a ceiling you have to find empirically: 20 parallel browser agents on one Chrome tripled tool errors per run, 8 was the stable number.",
            "Agents need a stop list, not a wish list. The run stops only for a blank standing answer, a required salary with no figure, an uncovered clearance question or anything that contradicts the packet; everything else is handled or reported as assumed.",
            "Honesty as a constraint makes the output better: tailoring only reorders and rephrases what is already true, and a fact check reverts any bullet that introduces a new number or tool."
          ]
        }
      },
      {
        id: "snowflake-17b",
        title: "70-80% faster queries on a 17B-row Snowflake security workload",
        tagline: "Traced slow security-event queries to repeated raw-table scans and semi-structured parsing, then moved the hot attributes into incrementally refreshed relational tables.",
        tags: ["Snowflake", "SQL", "Incremental models", "Semi-structured data", "Performance"],
        featured: true,
        metrics: [
          { value: "17B", label: "rows in the workload" },
          { value: "70-80%", label: "query time reduction" }
        ],
        links: { live: "", repo: "", note: "" },
        caseStudy: {
          problem: "A Snowflake security-event workload of roughly 17 billion rows had become slow for the teams who queried it. Every question against the data re-read the raw tables and re-parsed semi-structured attributes on the fly, so the cost of each query grew with the table rather than with the question.",
          approach: "Profile the slow queries before changing anything. The pattern was consistent: the same handful of attributes were parsed out of semi-structured columns on every run, and the raw table was scanned repeatedly. The fix was to pay that cost once, not per query, by materializing the frequently queried attributes into relational structures and refreshing them incrementally.",
          implementation: [
            "Identified the high-use attributes from query history and moved them into typed relational tables.",
            "Built incremental refresh so new events land in the relational layer without reprocessing the full 17B-row history.",
            "Pointed the common query paths at the relational layer while the raw tables remained the source of truth for anything not yet promoted."
          ],
          results: [
            "Reported query time fell by approximately 70-80% on the affected workload.",
            "Analysts stopped paying the parsing cost on every query, and the raw tables stopped being scanned for routine questions."
          ],
          learnings: [
            "Semi-structured flexibility is cheap to write and expensive to read at scale; promote what is queried often into typed columns.",
            "Incremental refresh is what makes the relational copy sustainable: a full rebuild on 17B rows would have recreated the original problem in a different shape."
          ]
        }
      },
      {
        id: "ssis-iceberg",
        title: "SQL Server and SSIS reporting migrated to CDC, Iceberg and Athena",
        tagline: "Replaced a legacy reporting workflow with change data capture into S3 and Apache Iceberg, queried through Athena and orchestrated by Step Functions.",
        tags: ["AWS DMS / CDC", "S3", "Apache Iceberg", "Athena", "Step Functions", "SSIS"],
        featured: true,
        metrics: [
          { value: "18 h", label: "refresh window before" },
          { value: "2 h", label: "refresh window after" }
        ],
        links: { live: "", repo: "", note: "" },
        caseStudy: {
          problem: "Legacy reporting ran on SQL Server with SSIS packages. The refresh took about 18 hours, which meant reports were a day behind and any failure pushed the next cycle out further.",
          approach: "Stop moving whole tables on a schedule. Capture changes from the source instead, land them in open table format on S3, and let dependent transformations run as soon as their inputs are ready rather than in one long serial chain.",
          implementation: [
            "Change data capture from the SQL Server sources into S3.",
            "Apache Iceberg tables on S3 as the storage layer, queried through Athena.",
            "Step Functions orchestration of the dependent transformations with explicit dependency control, retries and recoverable failure paths.",
            "Retired the SSIS packages once the new path matched the old outputs."
          ],
          results: [
            "The reported refresh window dropped from 18 hours to 2 hours.",
            "Reporting moved from a nightly batch to a same-day cycle with recoverable steps instead of a monolithic rerun."
          ],
          learnings: [
            "Most of an 18-hour window was waiting and re-reading, not transforming. CDC plus dependency-aware orchestration removes both.",
            "Open table formats on S3 decouple storage from the engine, so the query layer can change later without another migration."
          ]
        }
      },
      {
        id: "ai-coverage-ci",
        title: "AI-assisted ETL coverage checks in CI",
        tagline: "GitHub Actions calls AWS Lambda and the enterprise Claude API on each pull request to trace raw-to-curated coverage and flag data-loss gaps before release.",
        tags: ["Claude API", "GitHub Actions", "AWS Lambda", "CI/CD", "Data quality"],
        featured: true,
        metrics: [
          { value: "PR", label: "gate on every pull request" },
          { value: "Raw to curated", label: "coverage traced" }
        ],
        links: { live: "", repo: "", note: "" },
        caseStudy: {
          problem: "Pipeline changes could silently drop columns or rows between raw, staging and curated layers. Reviewers caught some of it; the rest surfaced after release as missing data in reports.",
          approach: "Make coverage a review gate rather than a reviewer's memory. On each pull request, have a model read the change and the pipeline definitions, trace which raw fields reach the curated layer, and flag anything that falls out along the way.",
          implementation: [
            "A GitHub Actions workflow runs on pull requests and invokes an AWS Lambda function.",
            "The Lambda assembles the pipeline context and calls the enterprise Claude API to trace raw-to-curated coverage.",
            "Findings are posted back to the pull request as potential data-loss gaps so the author fixes them before approval."
          ],
          results: [
            "Data-loss gaps are flagged before release, inside the existing pull-request approval flow.",
            "Review time goes to judgment calls rather than manual column-by-column tracing."
          ],
          learnings: [
            "LLM checks work best as advisory gates with a clear question (what is lost between these layers?) and a human approving the merge.",
            "Putting the check in CI means it runs every time, which matters more than how clever any single run is."
          ]
        }
      },
      {
        id: "snowflake-mcp",
        title: "Snowflake MCP servers and a governed-data chatbot",
        tagline: "Set up Snowflake MCP servers and a business-facing chatbot so day-to-day data questions are answered against governed data without an engineering ticket.",
        tags: ["Snowflake", "MCP", "Claude", "Governed data", "Self-service analytics"],
        featured: true,
        metrics: [
          { value: "Fewer", label: "ad hoc engineering requests" },
          { value: "Shorter", label: "turnaround on data questions" }
        ],
        links: { live: "", repo: "", note: "" },
        caseStudy: {
          problem: "Day-to-day data questions from business users came in as ad hoc requests to engineering. Each one was small, but together they interrupted platform work and made simple answers slow.",
          approach: "Give users a conversational interface that sits on top of the governance already in Snowflake, rather than a new copy of the data. Expose Snowflake through MCP servers so the assistant can query governed datasets with the access the user is entitled to.",
          implementation: [
            "Configured Snowflake MCP servers as the tool layer for the assistant.",
            "Delivered a business-facing chatbot that answers questions over governed data.",
            "Kept access and governance in Snowflake so the chatbot inherits existing controls instead of bypassing them."
          ],
          results: [
            "Fewer ad hoc engineering requests.",
            "Shorter turnaround on routine data questions."
          ],
          learnings: [
            "A chatbot over data is only as safe as the governance under it; building on existing controls is the whole design.",
            "The win is removing the ticket queue for small questions, which frees engineering time for the platform."
          ]
        }
      }
    ]
  },

  experience: {
    heading: "Experience",
    intro: "Four roles, from SSIS and SQL Server in healthcare to AWS, Snowflake and AI-assisted pipelines.",
    roles: [
      {
        title: "Data Engineer",
        company: "Tech Detectives Inc.",
        location: "Miami, FL",
        start: "Feb 2025",
        end: "Present",
        summary: "Own AWS and Snowflake data platforms end to end across batch, streaming, event-driven, API and CDC workloads.",
        bullets: [
          "Cut query time 70-80% on a 17B-row Snowflake security-event workload by tracing the bottleneck to repeated raw-table scans and semi-structured parsing, then moving high-use attributes into incrementally refreshed relational tables.",
          "Modernized legacy SQL Server and SSIS reporting with CDC into S3, Apache Iceberg and Athena, orchestrated by Step Functions; the refresh window dropped from 18 hours to 2.",
          "Added AI-assisted ETL coverage checks to pull-request approvals: GitHub Actions calls AWS Lambda and the enterprise Claude API to trace raw-to-curated coverage and flag data-loss gaps before release.",
          "Built an event-driven file-processing architecture on AWS: SQS queues buffer incoming source files, Step Functions route each file to a source-specific Glue job, and a completion gate holds downstream fact loads until every required feed has landed.",
          "Set up Snowflake MCP servers and a business-facing chatbot over governed data, cutting ad hoc engineering requests and the turnaround on everyday data questions.",
          "Run Glue, Step Functions and Snowflake pipelines across batch, streaming (Amazon Kinesis, Apache Kafka), event-driven, API and CDC workloads, with retries, dependency control and recoverable failure paths.",
          "Write the PySpark and SQL transformations across raw, staging and curated layers: incremental loads, fact and dimension modeling, data quality checks, reconciliation and business rules.",
          "Productionized Airflow/MWAA and dbt workflows for SaaS and API-fed pipelines with reusable landing and watermarking patterns, incremental models, source freshness checks and controlled promotion across environments.",
          "Assessed warehouse options for a 67-table Aurora PostgreSQL source and a 1 TB analytics footprint, comparing Redshift Serverless, Zero-ETL, DMS CDC and Snowflake against integration and reporting needs.",
          "Own platform reliability and governance: CloudWatch and Datadog monitoring, Terraform and AWS CDK infrastructure, IAM/KMS controls, lineage, freshness checks and restricted PII handling with controlled identifiers."
        ],
        stack: ["AWS Glue", "Step Functions", "Lambda", "SQS", "EventBridge", "Kinesis", "Kafka", "Snowflake", "Iceberg", "Athena", "PySpark", "dbt", "Airflow/MWAA", "Terraform", "AWS CDK", "Datadog", "Claude API"]
      },
      {
        title: "Data Engineer",
        company: "Triangulum Insights",
        location: "",
        start: "Jan 2024",
        end: "Feb 2025",
        summary: "Built and ran the AWS and Redshift platform for an advertising and consumer panel-data business.",
        bullets: [
          "Maintained Redshift reporting tables of 450M rows each with incremental stored procedures and sequenced loads, refreshing them without full reloads.",
          "Built the AWS platform on S3, Glue, Step Functions, Lambda and Redshift, carrying source data from landing to reporting-ready tables.",
          "Delivered curated Redshift datasets to Tableau users and supported 50+ Salesforce Marketing Cloud automations for scheduled refreshes, query activities and campaign sends.",
          "Turned reporting-team grain, source and refresh requirements into Redshift table designs and the Glue and Step Functions pipelines behind them.",
          "Diagnosed long-running Redshift procedures and workload-management pressure with system tables, then re-sequenced execution and materialized-view refreshes around real workload patterns.",
          "Applied business-key and ingestion-order deduplication so new partitions merge into the reporting set while the latest valid record wins.",
          "Handled source and pipeline failures by isolating malformed files, fixing schema drift and metadata issues, and reprocessing only the affected inputs.",
          "Automated external data intake with Python and API integrations, normalizing reporting and CRM feeds into S3 and Redshift for scheduled processing."
        ],
        stack: ["Amazon Redshift", "AWS Glue", "Step Functions", "Lambda", "S3", "Python", "Tableau", "Salesforce Marketing Cloud"]
      },
      {
        title: "SSIS Engineer",
        company: "Mindtree",
        location: "",
        start: "Jan 2020",
        end: "May 2022",
        summary: "Healthcare data integration on SQL Server and SSIS with HIPAA-aligned controls.",
        bullets: [
          "Built SSIS batch integrations moving healthcare data from source systems through SQL Server raw and staging layers into standardized reporting tables and views.",
          "Wrote SQL Server stored procedures, joins and scheduled transformations for raw-to-published data movement.",
          "Validated nightly outputs with source-to-target row counts and reconciliation checks, chasing missing records, duplicates and type conflicts before publication.",
          "Turned a 10-year healthcare retention rule into repeatable archival workflows, including an AWS-based archive for historical data.",
          "Kept nightly production schedules running through controlled restarts and source-delay escalation, with HIPAA-aligned PHI/PII masking and access controls."
        ],
        stack: ["SSIS", "SQL Server", "Stored procedures", "AWS archival", "HIPAA PHI/PII masking"]
      },
      {
        title: "Software Engineer Intern",
        company: "Mindtree",
        location: "",
        start: "Jun 2019",
        end: "Dec 2019",
        summary: "IT support and security hygiene for office users.",
        bullets: [
          "Resolved workstation, application and network incidents covering endpoint, connectivity and access issues.",
          "Administered Active Directory accounts, group memberships and permissions, and supported scheduled endpoint patching and antivirus updates.",
          "Delivered security-awareness guidance on phishing prevention and multi-factor authentication as part of routine support."
        ],
        stack: ["Active Directory", "Endpoint patching", "Security awareness"]
      }
    ]
  },

  education: {
    heading: "Education & Certifications",
    degrees: [
      {
        degree: "M.S. Cybersecurity",
        school: "Florida International University",
        location: "Miami, FL",
        start: "Aug 2022",
        end: "Apr 2024"
      },
      {
        degree: "B.Tech Computer Science & Engineering",
        school: "Rajiv Gandhi University of Knowledge Technologies",
        location: "",
        start: "",
        end: "Apr 2021"
      }
    ],
    certifications: [
      { name: "AWS Certified Solutions Architect - Associate", issuer: "Amazon Web Services", icon: "cloud" },
      { name: "CompTIA Security+", issuer: "CompTIA", icon: "shield-check" }
    ]
  },

  achievements: {
    heading: "Achievements & Recognition",
    intro: "Certifications and the measurable results behind the resume.",
    results: [
      { value: "70-80%", label: "faster queries on a 17B-row Snowflake workload", icon: "gauge" },
      { value: "18 h to 2 h", label: "reporting refresh after the SSIS to Iceberg/Athena migration", icon: "timer" },
      { value: "450M", label: "rows per Redshift reporting table, refreshed incrementally", icon: "layers" },
      { value: "50+", label: "Salesforce Marketing Cloud automations supported", icon: "send" },
      { value: "67 tables / 1 TB", label: "Aurora PostgreSQL warehouse assessment", icon: "scale" },
      { value: "10-year", label: "healthcare retention rule turned into archival workflows", icon: "archive" }
    ]
  },

  contact: {
    heading: "Contact",
    intro: "Open to Senior Data Engineer roles and conversations about cloud data architecture, AI platforms and cloud security. Email is the fastest way to reach me.",
    mailSubject: "Hello from your portfolio"
  },

  footer: {
    note: "Built as a static site with plain HTML, Tailwind CSS and vanilla JavaScript. No trackers."
  }
};

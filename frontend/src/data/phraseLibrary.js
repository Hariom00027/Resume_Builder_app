// Curated, ATS-optimized resume bullet phrases by industry/role
const phraseLibrary = [
  {
    role: "Software Engineer",
    icon: "💻",
    phrases: [
      "Engineered scalable microservices using Node.js and Docker, reducing API latency by [X]%",
      "Led the migration of a monolithic application to a cloud-native architecture on AWS, improving uptime by [X]%",
      "Built and maintained CI/CD pipelines using GitHub Actions, reducing deployment time from [X] hours to [X] minutes",
      "Developed RESTful APIs consumed by [X]+ active users, maintaining 99.9% uptime across all endpoints",
      "Optimized database query performance through indexing and query refactoring, cutting load times by [X]%",
      "Collaborated cross-functionally with design and product teams in Agile sprints to deliver features on schedule",
      "Mentored [X] junior engineers through code reviews, pair programming sessions, and technical workshops",
      "Implemented automated test suites (unit, integration, and E2E) with [X]% code coverage using Jest and Cypress",
      "Architected a real-time notification system handling [X]K concurrent WebSocket connections",
      "Reduced production bug rate by [X]% by introducing code quality gates and pre-commit linting hooks",
      "Designed and implemented a caching layer using Redis, reducing database load by [X]% during peak traffic",
      "Shipped [X] major product features in [X] months, contributing to a [X]% increase in user retention"
    ]
  },
  {
    role: "Product Manager",
    icon: "📋",
    phrases: [
      "Defined and executed product roadmap for a [X]-person engineering team, aligning with $[X]M revenue targets",
      "Led end-to-end product lifecycle from ideation to launch, achieving [X]% adoption within first [X] months",
      "Conducted [X]+ user interviews and analyzed customer feedback to prioritize a backlog of [X]+ features",
      "Partnered with engineering and design to ship [X] major releases, each with measurable OKR impact",
      "Managed stakeholder relationships across [X] departments, securing sign-off on quarterly product strategy",
      "Increased Monthly Active Users (MAU) by [X]% through data-driven feature experimentation and A/B testing",
      "Defined and tracked key product KPIs including DAU, NPS, LTV, and conversion rate to report to executive leadership",
      "Reduced customer churn by [X]% by identifying friction points in onboarding and leading targeted UX improvements",
      "Created detailed PRDs, user stories, and wireframes that enabled the engineering team to execute with minimal ambiguity",
      "Launched a mobile feature used by [X]K+ users within the first week, generating [X]% of app revenue"
    ]
  },
  {
    role: "Data Scientist / Analyst",
    icon: "📊",
    phrases: [
      "Built and deployed a predictive ML model (XGBoost/Random Forest) that increased forecast accuracy by [X]%",
      "Analyzed datasets of [X]M+ records using Python (Pandas, NumPy) to surface insights that drove $[X]M in cost savings",
      "Designed and maintained interactive dashboards in Tableau/Power BI, used by [X]+ stakeholders weekly",
      "Automated [X] manual reporting workflows using Python and SQL, saving [X] hours of analyst time per week",
      "Collaborated with engineering teams to integrate ML models into production systems serving [X]K+ users/day",
      "Conducted A/B experiments and cohort analyses to evaluate feature impact on key business metrics",
      "Developed a customer segmentation model that enabled marketing to improve campaign ROI by [X]%",
      "Created and maintained ETL pipelines ingesting [X]GB of data daily using Apache Spark and Airflow",
      "Presented data-driven findings and recommendations to C-level executives, influencing strategic decisions",
      "Reduced model inference time by [X]% through feature engineering and hyperparameter optimization"
    ]
  },
  {
    role: "Marketing Manager",
    icon: "📣",
    phrases: [
      "Developed and executed a multi-channel marketing strategy that grew MQLs by [X]% quarter-over-quarter",
      "Managed a $[X]K digital advertising budget across Google Ads and Meta, achieving [X]x ROAS",
      "Oversaw the launch of [X] product campaigns, generating [X]K+ leads and $[X]M in attributed pipeline",
      "Built and scaled an email marketing program to [X]K+ subscribers with an average open rate of [X]%",
      "Led SEO initiatives that increased organic traffic by [X]% and improved ranking for [X]+ target keywords",
      "Collaborated with sales to align go-to-market strategy, reducing average deal cycle by [X] days",
      "Produced and distributed [X] pieces of long-form content (whitepapers, case studies, blogs) per quarter",
      "Managed a team of [X] marketers, fostering a culture of data-driven experimentation and continuous improvement",
      "Increased social media following by [X]% in [X] months through organic content and community engagement",
      "Coordinated [X] industry events and webinars, generating [X]K registrations and expanding brand reach"
    ]
  },
  {
    role: "UI/UX Designer",
    icon: "🎨",
    phrases: [
      "Designed end-to-end user flows and high-fidelity prototypes in Figma for [X]+ product features",
      "Conducted [X]+ usability testing sessions that uncovered critical pain points and informed strategic design revisions",
      "Built and maintained a comprehensive design system used by [X]+ engineers, ensuring UI consistency across all platforms",
      "Increased key conversion rates by [X]% through iterative redesign of onboarding flows based on user research",
      "Collaborated with product and engineering in Agile sprints to deliver polished designs on time",
      "Reduced user support tickets by [X]% by simplifying the navigation structure and information hierarchy",
      "Created accessible designs complying with WCAG 2.1 AA standards across web and mobile surfaces",
      "Facilitated [X]+ discovery workshops with stakeholders to align on user needs and product direction",
      "Produced detailed design specifications and documentation to hand off to engineering with zero ambiguity",
      "Improved app store rating from [X] to [X] stars following a full UX audit and redesign of the core experience"
    ]
  },
  {
    role: "Sales Representative",
    icon: "💼",
    phrases: [
      "Exceeded quota by [X]% for [X] consecutive quarters, closing an average of $[X]K ARR per deal",
      "Prospected and managed a pipeline of [X]+ accounts worth $[X]M in combined opportunity value",
      "Closed [X]+ enterprise deals including $[X]K+ contracts with Fortune 500 companies",
      "Reduced average sales cycle by [X] days by implementing structured discovery and demo frameworks",
      "Built lasting relationships with [X]+ C-level and VP-level stakeholders across target verticals",
      "Maintained a CRM hygiene score of [X]%+ in Salesforce, ensuring accurate pipeline visibility",
      "Collaborated with marketing and CS teams to develop case studies and references that accelerated deal cycles",
      "Onboarded and ramped [X] new sales hires, contributing to a [X]% improvement in team-wide quota attainment",
      "Negotiated and closed a [X]-year, $[X]M strategic partnership with a key enterprise account",
      "Achieved [X]% net revenue retention across managed accounts through proactive relationship management"
    ]
  },
  {
    role: "Project Manager",
    icon: "🗂️",
    phrases: [
      "Managed [X]+ concurrent projects with a combined budget of $[X]M, delivering [X]% on time and within scope",
      "Led cross-functional teams of [X]+ members across engineering, design, and business stakeholders",
      "Reduced project delivery delays by [X]% by introducing structured sprint planning and weekly risk reviews",
      "Developed and maintained detailed project plans, RAID logs, and executive status reports",
      "Facilitated Agile ceremonies (standups, sprint reviews, retrospectives) for a team of [X]+ engineers",
      "Coordinated vendor contracts and negotiations, achieving [X]% savings against initial budget estimates",
      "Implemented a PMO framework that standardized delivery processes across [X] teams and [X]+ projects",
      "Resolved [X]+ scope creep incidents by enforcing a defined change control process with stakeholder sign-off",
      "Delivered a $[X]M digital transformation project [X] weeks ahead of schedule",
      "Maintained a stakeholder alignment score of [X]%+ through proactive communication and issue escalation"
    ]
  },
  {
    role: "DevOps / SRE",
    icon: "⚙️",
    phrases: [
      "Managed and maintained cloud infrastructure on AWS/GCP/Azure serving [X]M+ requests per day",
      "Reduced system downtime by [X]% by implementing automated health checks, alerting, and runbook-driven recovery",
      "Built and maintained Kubernetes clusters managing [X]+ microservices across production environments",
      "Automated infrastructure provisioning using Terraform and Ansible, reducing manual setup time by [X]%",
      "Improved MTTR (Mean Time to Recover) from [X] hours to [X] minutes through enhanced observability and alerting",
      "Established security hardening practices (IAM, VPC, secrets management) that achieved [X]+ compliance certifications",
      "Designed a disaster recovery architecture with an RTO of [X] minutes and RPO of [X] seconds",
      "Led oncall rotation for [X]+ services, maintaining [X]% SLA adherence over [X] months",
      "Implemented cost optimization strategies that reduced cloud spend by $[X]K/month without impacting performance",
      "Built centralized logging and monitoring solutions (ELK Stack / Datadog / Prometheus + Grafana) for [X]+ services"
    ]
  },
  {
    role: "HR / People Operations",
    icon: "🤝",
    phrases: [
      "Managed full-cycle recruiting for [X]+ technical and non-technical roles, reducing time-to-hire by [X] days",
      "Designed and implemented a new employee onboarding program, improving 30-day retention by [X]%",
      "Led company-wide HR initiatives reaching [X]+ employees across [X] office locations",
      "Developed and administered compensation benchmarking studies, ensuring market-competitive pay across [X] roles",
      "Reduced voluntary attrition by [X]% through the launch of engagement surveys and action planning programs",
      "Partnered with [X] business leaders to build annual talent plans, succession maps, and L&D budgets",
      "Overhauled the performance management cycle, improving employee satisfaction scores by [X] points",
      "Managed employee relations cases with a resolution rate of [X]%, maintaining a compliant and equitable workplace",
      "Administered HRIS (Workday/BambooHR/ADP) for [X]+ employees, ensuring data accuracy and process compliance",
      "Launched a DEI initiative that increased underrepresented group hiring by [X]% in [X] year"
    ]
  },
  {
    role: "Finance / Accounting",
    icon: "💰",
    phrases: [
      "Managed a $[X]M annual operating budget, delivering [X]% variance against plan at fiscal year end",
      "Prepared and presented monthly, quarterly, and annual financial statements to the C-suite and board",
      "Led financial modeling and scenario analysis for a $[X]M capital allocation decision",
      "Streamlined the monthly close process by [X] days through automation of manual reconciliation workflows",
      "Reduced outstanding AR by [X]% through implementation of a proactive collections and aging review cadence",
      "Supported a $[X]M M&A due diligence process, reviewing [X]+ financial documents and models",
      "Coordinated external audits with [X]% clean opinion outcomes over [X] consecutive years",
      "Identified $[X]K in cost-saving opportunities through spend analysis and vendor contract renegotiation",
      "Built financial dashboards in Excel/Tableau that improved reporting frequency from monthly to weekly",
      "Achieved [X]% improvement in budget forecast accuracy through refined assumption modeling"
    ]
  }
];

export default phraseLibrary;

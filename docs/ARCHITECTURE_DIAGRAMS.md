# Architecture Diagrams

## DNS Routing Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   harvard.      │    │     mit.        │    │   stanford.     │
│   lms.app       │    │   lms.app       │    │   lms.app       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │              DNS Resolution                   │
          │              *.lms.app → IC                   │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌────────────────────────────────────────────────┐
          │          Internet Computer                      │
          │                                                │
          │  ┌─────────────────────────────────────────┐   │
          │  │           Frontend Canister             │   │
          │  │                                         │   │
          │  │  ┌─────────────────────────────────┐    │   │
          │  │  │     Hostname Extraction         │    │   │
          │  │  │                                 │    │   │
          │  │  │  window.location.hostname       │    │   │
          │  │  │      ↓                          │    │   │
          │  │  │  "harvard" | "mit" | "stanford" │    │   │
          │  │  └─────────────────────────────────┘    │   │
          │  └─────────────────┬───────────────────────┘   │
          │                    │                           │
          │  ┌─────────────────▼───────────────────────┐   │
          │  │           Router Canister               │   │
          │  │                                         │   │
          │  │  ┌─────────────────────────────────┐    │   │
          │  │  │      Tenant Lookup              │    │   │
          │  │  │                                 │    │   │
          │  │  │  tenant_id → canister_id        │    │   │
          │  │  │                                 │    │   │
          │  │  │  harvard → rdmx6-jaaaa-...      │    │   │
          │  │  │  mit     → be2us-64aaa-...      │    │   │
          │  │  │  stanford→ bkyz2-fmaaa-...      │    │   │
          │  │  └─────────────────────────────────┘    │   │
          │  └─────────────────┬───────────────────────┘   │
          │                    │                           │
          │  ┌─────────────────▼───────────────────────┐   │
          │  │         Tenant Canisters                │   │
          │  │                                         │   │
          │  │  ┌───────────┐ ┌───────────┐ ┌────────┐ │   │
          │  │  │ Harvard   │ │   MIT     │ │Stanford│ │   │
          │  │  │ Canister  │ │ Canister  │ │Canister│ │   │
          │  │  │           │ │           │ │        │ │   │
          │  │  │ Users     │ │ Users     │ │ Users  │ │   │
          │  │  │ Courses   │ │ Courses   │ │Courses │ │   │
          │  │  │ Grades    │ │ Grades    │ │ Grades │ │   │
          │  │  └───────────┘ └───────────┘ └────────┘ │   │
          │  └─────────────────────────────────────────┘   │
          └────────────────────────────────────────────────┘
```

## Request Flow Timeline

```
User                DNS             IC Boundary        Frontend         Router          Tenant
 │                   │                  │                │               │               │
 │ GET harvard.lms.app                  │                │               │               │
 ├─────────────────→ │                  │                │               │               │
 │                   │                  │                │               │               │
 │                   │ IP: 198.51.100.1 │                │               │               │
 │ ←─────────────────┤                  │                │               │               │
 │                                      │                │               │               │
 │ HTTPS Request                        │                │               │               │
 │ Host: harvard.lms.app                │                │               │               │
 ├─────────────────────────────────────→│                │               │               │
 │                                      │                │               │               │
 │                                      │ Forward Request │               │               │
 │                                      ├───────────────→│               │               │
 │                                      │                │               │               │
 │                                      │                │ Extract "harvard"             │
 │                                      │                │ from Host header              │
 │                                      │                ├──────────────→│               │
 │                                      │                │               │               │
 │                                      │                │               │ Lookup tenant │
 │                                      │                │               │ "harvard"     │
 │                                      │                │               │               │
 │                                      │                │               │ Route to      │
 │                                      │                │               │ Harvard       │
 │                                      │                │               │ Canister      │
 │                                      │                │               ├──────────────→│
 │                                      │                │               │               │
 │                                      │                │               │               │ Process
 │                                      │                │               │               │ Harvard
 │                                      │                │               │               │ Request
 │                                      │                │               │               │
 │                                      │                │               │ Harvard Data  │
 │                                      │                │               │ ←─────────────┤
 │                                      │                │               │               │
 │                                      │                │ Response      │               │
 │                                      │                │ ←─────────────┤               │
 │                                      │                │               │               │
 │                                      │ Harvard Portal │               │               │
 │                                      │ ←──────────────┤               │               │
 │                                      │                │               │               │
 │ Harvard LMS Portal                   │                │               │               │
 │ ←────────────────────────────────────┤                │               │               │
 │                                      │                │               │               │
```

## Error Flow Diagram

```
Browser Request → DNS → Boundary Node → Frontend → Router
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   Lookup    │
                                              │  Tenant ID  │
                                              └─────┬───────┘
                                                    │
                               ┌────────────────────┼────────────────────┐
                               │                    │                    │
                               ▼                    ▼                    ▼
                        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                        │   Found     │    │ Not Found   │    │   Error     │
                        │   Active    │    │             │    │             │
                        └─────┬───────┘    └─────┬───────┘    └─────┬───────┘
                              │                  │                  │
                              ▼                  ▼                  ▼
                        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                        │ Route to    │    │Return 404   │    │Return 500   │
                        │ Tenant      │    │Tenant not   │    │Internal     │
                        │ Canister    │    │found        │    │error        │
                        └─────────────┘    └─────────────┘    └─────────────┘
                              │                  │                  │
                              ▼                  ▼                  ▼
                        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                        │ Tenant      │    │ Show        │    │ Show        │
                        │ Response    │    │ "Register   │    │ "Try again  │
                        │             │    │ Institution"│    │ later"      │
                        └─────────────┘    └─────────────┘    └─────────────┘
```

## Tenant Status Flow

```
Tenant Request
      │
      ▼
┌─────────────┐
│ Check       │
│ Tenant      │
│ Status      │
└─────┬───────┘
      │
┌─────┴─────┬─────────────┬─────────────┐
│           │             │             │
▼           ▼             ▼             ▼
┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Active  │ │Suspended│   │Maintenance│ │ Invalid │
└────┬────┘ └────┬────┘   └────┬────┘   └────┬────┘
     │           │             │             │
     ▼           ▼             ▼             ▼
┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐
│Forward  │ │Return   │   │Return   │   │Return   │
│Request  │ │503      │   │503      │   │404      │
│         │ │Suspended│   │Under    │   │Not Found│
│         │ │         │   │Maint.   │   │         │
└─────────┘ └─────────┘   └─────────┘   └─────────┘
     │           │             │             │
     ▼           ▼             ▼             ▼
┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐
│Normal   │ │Show     │   │Show     │   │Redirect │
│Portal   │ │Contact  │   │Maint.   │   │to       │
│         │ │Admin    │   │Page     │   │Register │
└─────────┘ └─────────┘   └─────────┘   └─────────┘
```

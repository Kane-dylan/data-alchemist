# Data Alchemist 🧪

A sophisticated Next.js application for managing and analyzing complex data relationships between clients, workers, and tasks. Built with TypeScript, Tailwind CSS, and modern React patterns, featuring AI-powered filtering and intelligent data validation.

## ✨ Features

### 🔥 Core Functionality
- **Multi-Entity Data Management**: Handle clients, workers, and tasks with dedicated data structures and seamless entity switching
- **AI-Powered Filtering**: Natural language queries with intelligent field mapping and context-aware processing
- **Advanced Data Validation**: Real-time validation with comprehensive error reporting and field-specific feedback
- **Rule-Based Processing**: Create and manage complex business rules with drag-and-drop prioritization
- **Priority Configuration**: Advanced priority weighting with pairwise comparison matrices and preset profiles
- **Persistent Data Storage**: Automatic local storage with session restoration and file metadata tracking

### 🤖 AI-Enhanced Operations
- **Natural Language Filtering**: 
  - `"Show clients with priority level greater than 3"`
  - `"Tasks that require coding skills"`
  - `"Workers in GroupB with qualification level 5"`
  - `"Design tasks longer than 1 phase"`
  - `"Show tasks with concurrency ≥ 2"`
- **Smart Field Mapping**: Automatically maps natural language to actual field names with fallback matching
- **AI Assistant**: Floating contextual assistant providing suggestions for rules, filters, and validations
- **Dynamic Expression Generation**: Converts text queries to JavaScript filter expressions with error handling
- **Intelligent Query Processing**: Handles complex patterns like phase ranges, skill combinations, and concurrent assignments

### 📊 Data Processing
- **Multi-Format Import**: Support for CSV and Excel files with automatic parsing and entity type detection
- **Live Data Editing**: In-place editing with instant validation feedback and error highlighting
- **Advanced Export Options**: 
  - Individual CSV exports per entity type with timestamps
  - Combined Excel workbooks with multiple sheets and metadata
  - Complete data packages as ZIP files with configuration
  - Rules configuration export as JSON with validation metadata
- **Data Integrity**: Cross-entity reference validation and dependency tracking
- **Batch Operations**: Multi-file upload with validation summaries and error reporting

### 🎯 Advanced Filtering
- **Dual Mode Filtering**:
  - **AI Mode**: Natural language processing with context awareness and smart field detection
  - **Text Mode**: Enhanced pattern matching with logical operators and manual expression building
- **Quick Filters**: Pre-defined common filters for rapid data exploration per entity type
- **Filter Chaining**: Apply multiple filters with visual filter chips and cumulative results
- **Complex Query Support**: 
  - Range queries: `"priority is 2 to 4"`, `"phases 1 to 3"`
  - Contains operations: `"name contains Corp"`, `"skills include coding"`
  - Comparison operators: `>`, `<`, `>=`, `<=`, `=`, `≥`, `≤`
  - Phase-based filtering: `"tasks in phase 2"`, `"available slots include 3"`
  - Skill matching: `"coding and ml skills"`, `"testing or ui/ux"`
  - Complex combinations: `"Design tasks longer than 1 phase and run in phase 2"`

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15.3.4 with App Router and Turbopack for fast development
- **Language**: TypeScript 5+ with strict type checking and comprehensive interfaces
- **Styling**: Tailwind CSS 4.1.11 with custom components and responsive design
- **UI Components**: Radix UI primitives with custom styling and accessibility features
- **State Management**: React hooks with local storage persistence and session restoration
- **Animations**: Framer Motion for smooth interactions and micro-animations
- **File Processing**: ExcelJS, PapaParse, JSZip for comprehensive data import/export
- **AI Integration**: OpenRouter API with Claude 3 Haiku for natural language processing
- **Data Validation**: Custom validation engine with real-time field-level feedback

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes for filtering and rule processing
│   │   ├── filter-expression/  # AI-powered filter generation
│   │   └── parse-rule/         # Natural language rule parsing
│   ├── globals.css        # Global styles and Tailwind configuration
│   ├── layout.tsx         # Root layout with providers and metadata
│   └── page.tsx           # Main application with state management
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── button.tsx    # Customizable button component
│   │   ├── input.tsx     # Form input with validation states
│   │   ├── card.tsx      # Container component with variants
│   │   ├── tabs.tsx      # Tabbed interface component
│   │   ├── badge.tsx     # Status and type indicators
│   │   └── ...           # Additional UI primitives
│   ├── AIAssistant.tsx   # Floating AI suggestion system
│   ├── AiFilter.tsx      # AI-enhanced natural language filtering
│   ├── TextFilter.tsx    # Manual filtering with logical operators
│   ├── DataTable.tsx     # Interactive data grid with editing
│   ├── ManageFilters.tsx # Comprehensive filter management interface
│   ├── ModularRuleManager.tsx # Advanced rule creation and management
│   ├── TabbedDataView.tsx # Multi-entity tabbed interface
│   ├── ModernFileUpload.tsx # Drag-and-drop file upload component
│   ├── InlineStatsPanel.tsx # Data health and statistics dashboard
│   └── EnhancedPrioritySlider.tsx # Priority configuration interface
├── utils/                # Utility functions and business logic
│   ├── dataStorage.ts    # Local storage operations with compression
│   ├── exportUtility.ts  # Data export functionality (CSV/Excel/ZIP)
│   ├── validationEngine.ts # Comprehensive data validation rules
│   ├── filterWithClaude.ts # AI filtering integration
│   ├── ruleBuilder.ts    # Business rule construction logic
│   ├── rulesExport.ts    # Rule configuration serialization
│   ├── mapHeaders.ts     # CSV header mapping and normalization
│   ├── validateData.ts   # Data quality checks and formatting
│   └── download.ts       # File download utilities
└── lib/
    └── utils.ts          # Common utility functions and helpers
```

### Data Flow Architecture
1. **File Upload** → CSV/Excel parsing → Entity type detection → Validation engine
2. **AI Filtering** → Natural language processing → Expression generation → Data filtering
3. **Rule Management** → AI parsing or manual builder → Rule validation → Priority ordering
4. **Data Export** → Entity selection → Format choice → File generation → Download

### State Management
- **Entity-Specific Storage**: Separate state management for clients, workers, and tasks
- **Original Data Preservation**: Maintains original datasets for filter reset functionality
- **Validation State**: Real-time validation results with error mapping and field-level feedback
- **Filter State**: Active filters, query history, and result caching
- **Rule State**: Business rules with priority ordering and confidence scoring

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ with npm, yarn, or pnpm
- Modern web browser with JavaScript enabled
- Optional: OpenRouter API key for enhanced AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd data-alchemist
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup (Optional)**
   ```bash
   # Create .env.local for AI features
   echo "OPENROUTER_API_KEY=your_api_key_here" > .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Start Guide
1. **Upload Sample Data**: Use the sample files in `/public/sample1/` or `/public/sample2/`
2. **Try AI Filtering**: Use natural language queries like `"high priority clients"`
3. **Create Rules**: Describe business logic in plain English
4. **Export Data**: Download processed data in your preferred format

## 📝 Usage Guide

### Data Import
1. **Upload Files**: Use the modern drag-and-drop file upload component to import CSV or Excel files
2. **Select Entity Type**: Choose whether the data represents clients, workers, or tasks during upload
3. **Automatic Validation**: The system validates data format and highlights errors with detailed messages
4. **Review Results**: Check the validation panel for data quality issues and required corrections
5. **Session Persistence**: Data is automatically saved to local storage with file metadata and upload timestamps

### Filtering Data

#### AI Mode (Recommended)
Use natural language queries for intelligent filtering:
- **Basic Comparisons**: `"priority level equals 5"`, `"duration greater than 1"`
- **Text Matching**: `"client name contains Corp"`, `"skills include coding"`
- **Complex Queries**: `"Design tasks longer than 1 phase"`, `"workers with qualification level > 7"`
- **Phase Operations**: `"tasks in phase 2"`, `"available slots include 3"`, `"phases 1 to 4"`
- **Skill Combinations**: `"coding and ml skills"`, `"testing or ui/ux skills"`
- **Concurrency**: `"show tasks with concurrency ≥ 2"`, `"max concurrent equals 1"`

#### Text Mode (Manual)
Use structured queries with logical operators:
- **Operators**: `>`, `<`, `>=`, `<=`, `=`, `≥`, `≤`
- **Examples**: `priority > 3`, `name contains "Acme"`, `qualification level >= 4`
- **Field References**: Direct field name matching with fallback to partial matching

#### Quick Filters
Pre-configured filters for common use cases:
- **Clients**: High Priority, VIP Status, Location-based, Budget ranges
- **Workers**: Skill-based, Qualification levels, Group membership, Availability
- **Tasks**: Duration ranges, Category filters, Phase requirements, Concurrency levels

#### Filter Management
- **Filter Chaining**: Apply multiple filters cumulatively with visual chips
- **Active Filter Display**: See all applied filters with type indicators (AI/Manual)
- **Filter History**: Previous queries are saved and can be reapplied
- **Reset Options**: Clear individual filters or reset all to original dataset

### Managing Rules

#### AI-Generated Rules
1. **Natural Language Input**: Describe business logic in plain English
   - `"Tasks with similar skill requirements should run together"`
   - `"Limit senior developers to maximum 3 concurrent projects"`
   - `"Tasks T5 and T9 should never run simultaneously"`
2. **Automatic Parsing**: AI converts descriptions to structured rule objects
3. **Confidence Scoring**: Each rule receives a confidence percentage
4. **Type Classification**: Automatic categorization (co-run, load limits, exclusions, etc.)

#### Manual Rule Builder
Create rules using structured forms with validation:

**Co-Run Rules**: Group tasks that should execute together
- Specify comma-separated task IDs
- Define reasons (efficiency, skill similarity, dependencies)
- Set execution priority

**Load Limit Rules**: Control workload distribution
- Select worker groups (senior-dev, junior-dev, designers, analysts)
- Set maximum slots per phase
- Define override conditions

**Slot Restriction Rules**: Manage resource allocation
- Specify client and worker group relationships
- Set minimum common slot requirements
- Define allocation priorities

**Phase Window Rules**: Restrict task execution timeframes
- Specify task IDs and allowed phase ranges
- Set start and end phases (1-10)
- Add scheduling constraints

**Pattern Match Rules**: Apply rules based on data patterns
- Select fields (names, skills, categories)
- Define regex patterns for matching
- Choose action templates (priority, assignment, exclusion)

#### Rule Management Features
- **Drag-and-Drop Ordering**: Prioritize rules with visual reordering
- **Rule Statistics**: View rule counts by type and status
- **Validation**: Real-time rule structure validation with error reporting
- **Export/Import**: Save rule configurations as JSON with metadata

### Data Export

#### Individual Exports
- **Client CSV**: Export client data with all fields and metadata
- **Worker CSV**: Export worker information including skills and availability
- **Task CSV**: Export task definitions with requirements and constraints
- **Rules JSON**: Export business rules with configuration metadata

#### Combined Exports
- **Excel Workbooks**: Multi-sheet files with all entity types and formatting
- **ZIP Packages**: Complete data packages with CSV files, Excel workbook, and rules configuration
- **Timestamped Files**: All exports include timestamps for version tracking

#### Export Features
- **Format Preservation**: Maintains data types and formatting during export
- **Metadata Inclusion**: Export includes file information, record counts, and processing history
- **Error Handling**: Graceful handling of export errors with user feedback
- **Batch Processing**: Efficient handling of large datasets during export

## 🎨 Key Components

### AIAssistant
Floating AI assistant providing contextual suggestions:
- **Intelligent Suggestions**: Context-aware recommendations for business rules, filtering strategies, and validation improvements
- **Confidence Scoring**: Each suggestion includes confidence percentages (70-100%)
- **Type Classification**: Categorized suggestions (rule, filter, validation) with color-coded badges
- **Interactive Interface**: Apply or dismiss suggestions with visual feedback
- **Persistent Positioning**: Floating button with smooth animations and accessibility support

### ManageFilters  
Comprehensive filtering interface with advanced capabilities:
- **Dual-Mode Filtering**: Seamless switching between AI and manual text filtering
- **Quick Filter Buttons**: Pre-configured filters specific to each entity type
- **Active Filter Management**: Visual chips showing applied filters with removal options
- **Filter Chaining**: Cumulative application of multiple filters with result tracking
- **Error Handling**: User-friendly error messages with suggested corrections
- **Results Preview**: Real-time preview of filtered results before application

### ModularRuleManager
Advanced rule creation and management system:
- **AI Rule Generation**: Natural language rule descriptions converted to structured objects
- **Manual Rule Builder**: Comprehensive form-based rule creation with validation
- **Rule Type Support**: Co-run, load limits, slot restrictions, phase windows, pattern matching, precedence
- **Drag-and-Drop Ordering**: Visual rule prioritization with immediate reordering
- **Rule Statistics**: Dashboard showing rule counts by type and status
- **Confidence Tracking**: AI-generated rules include confidence scores
- **Export Capabilities**: JSON export with metadata and validation information

### DataTable
Interactive data grid with powerful editing features:
- **In-Place Editing**: Direct cell editing with immediate validation feedback
- **Real-Time Validation**: Field-level validation with error highlighting and messages
- **Sortable Columns**: Click-to-sort functionality with visual indicators
- **Error Highlighting**: Color-coded cells showing validation issues
- **Responsive Design**: Adaptive layout for different screen sizes
- **Type-Aware Editing**: Context-specific input validation based on field types

### TabbedDataView
Multi-entity interface for seamless data management:
- **Entity Switching**: Tabbed interface for clients, workers, and tasks
- **Tab Management**: Create, delete, and rename tabs with confirmation dialogs
- **Data Isolation**: Separate state management for each entity type
- **File Metadata**: Display upload information and record counts per tab
- **Context Preservation**: Maintains filters and selections when switching tabs

### ModernFileUpload
Sophisticated file upload component:
- **Drag-and-Drop Interface**: Visual drop zones with hover states and animations
- **Multi-Format Support**: CSV and Excel files with automatic format detection
- **Entity Type Selection**: Choose data type during upload process
- **Progress Feedback**: Upload progress indicators and status messages
- **Error Handling**: Comprehensive error reporting for invalid files or formats
- **File Validation**: Pre-upload validation of file size and format

### InlineStatsPanel
Data health and statistics dashboard:
- **Record Counts**: Real-time count of records per entity type
- **Validation Status**: Summary of validation errors and warnings
- **Data Quality Metrics**: Health indicators and quality scores
- **Visual Indicators**: Color-coded status indicators and progress bars
- **Export Statistics**: Track of exported files and successful operations

### EnhancedPrioritySlider
Advanced priority configuration interface:
- **Weighted Scoring**: Assign importance weights to different criteria
- **Pairwise Comparison**: Matrix-based priority comparison tool
- **Preset Profiles**: Pre-configured priority schemes for common scenarios
- **Dynamic Ranking**: Real-time priority recalculation with visual feedback
- **Export Integration**: Direct export functionality with priority-based sorting

## 🔧 Configuration

### Data Validation Rules
The system supports comprehensive validation for:

#### Clients
- **ClientID**: Required, unique, format validation with duplicate detection
- **ClientName**: Required field with non-empty validation
- **PriorityLevel**: Integer 1-5 range validation with bounds checking
- **RequestedTaskIDs**: Comma-separated task ID format (T1,T2,T3) with pattern matching
- **GroupTag**: Enum validation (GroupA, GroupB, GroupC) with predefined values
- **AttributesJSON**: JSON format validation with syntax checking

#### Workers
- **WorkerID**: Required, unique identifier with duplication prevention
- **WorkerName**: Required field with length validation
- **QualificationLevel**: Integer 1-10 range with skill level validation
- **Skills**: Comma-separated or array format with skill tag validation
- **AvailableSlots**: Array of phase numbers [1,3,5] with range checking
- **MaxLoadPerPhase**: Positive integer validation with capacity limits
- **WorkerGroup**: Non-empty string validation with group membership

#### Tasks
- **TaskID**: Required, unique identifier with format validation
- **TaskName**: Required field with descriptive content validation
- **Category**: Required category classification with predefined options
- **Duration**: Positive integer (number of phases ≥1) with timeline validation
- **RequiredSkills**: Comma-separated skill tags with skill database validation
- **MaxConcurrent**: Positive integer for parallel assignments with resource limits
- **PreferredPhases**: Range syntax (1-3) or array [2,4,5] with phase validation

### Environment Configuration
```bash
# Optional AI Enhancement
OPENROUTER_API_KEY=your_api_key_here

# Application Settings (automatic)
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_BUILD_MODE=development
```

## 🔌 API Endpoints

### `/api/filter-expression`
- **Method**: POST
- **Purpose**: Converts natural language queries to JavaScript filter expressions
- **Parameters**:
  - `query`: Natural language filter description
  - `entityType`: Target data type (client/worker/task)
  - `data`: Sample data for context (optional)
- **Response**: JSON with expression string and metadata
- **Error Handling**: Comprehensive error messages with suggestions

### `/api/parse-rule`
- **Method**: POST
- **Purpose**: Parses and validates business rule definitions
- **Parameters**:
  - `ruleText`: Natural language rule description
  - `entityType`: Applicable entity type
- **Response**: Structured rule object with type classification
- **AI Integration**: Uses Claude 3 Haiku for intelligent parsing

## 🎯 Advanced Features

### Priority Configuration
- **Weighted Scoring**: Assign importance weights to different criteria with dynamic recalculation
- **Pairwise Comparison**: Matrix-based priority comparison with consistency checking
- **Preset Profiles**: Pre-configured priority schemes for common business scenarios
- **Dynamic Ranking**: Real-time priority recalculation with visual feedback
- **Export Integration**: Priority-aware data sorting and export functionality

### Smart Filtering
- **Field Mapping**: Automatic translation of natural language to field names with fuzzy matching
- **Context Awareness**: Entity-specific field recognition with intelligent defaults
- **Complex Expressions**: Support for nested logical operations with precedence handling
- **Pattern Recognition**: Intelligent query interpretation with semantic understanding
- **Error Recovery**: Graceful handling of malformed queries with correction suggestions

### Data Relationships
- **Cross-Entity References**: Link clients to tasks, workers to skills with referential integrity
- **Dependency Tracking**: Monitor data relationships and constraints with validation
- **Integrity Validation**: Ensure referential integrity across entities with constraint checking
- **Relationship Visualization**: Visual representation of entity connections and dependencies

### Performance Optimization
- **Lazy Loading**: Efficient data loading with virtualization for large datasets
- **Caching Strategy**: Intelligent caching of filter results and validation outcomes
- **Memory Management**: Optimized state management with garbage collection
- **Background Processing**: Asynchronous operations for export and validation tasks

## 🔍 Example Use Cases

### Project Management
- **Resource Allocation**: Track client requirements and optimize task assignments
- **Skill Matching**: Match workers to tasks based on qualification levels and skill sets
- **Timeline Management**: Coordinate task execution across phases with dependency tracking
- **Priority Balancing**: Balance competing priorities using weighted scoring systems

### Resource Planning
- **Capacity Management**: Filter workers by qualification, availability, and workload
- **Skill Gap Analysis**: Identify missing skills and training requirements
- **Workload Distribution**: Balance assignments across teams and individuals
- **Phase Optimization**: Optimize resource allocation across project phases

### Client Relationship Management
- **Priority Segmentation**: Categorize clients by importance and project value
- **Requirement Tracking**: Monitor client-specific task requirements and preferences
- **Performance Analytics**: Generate reports on client engagement and satisfaction
- **Revenue Optimization**: Prioritize high-value clients and projects

### Data Quality Management
- **Validation Workflows**: Implement comprehensive data quality checks and corrections
- **Error Tracking**: Monitor and resolve data quality issues with detailed reporting
- **Compliance Checking**: Ensure data meets regulatory and business requirements
- **Audit Trails**: Maintain complete history of data changes and validation results

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build production-ready application
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
npm run type-check   # Run TypeScript compiler checks
```

### Code Quality
- **TypeScript**: Strict type checking with comprehensive interfaces
- **ESLint**: Code quality enforcement with custom rules
- **Prettier**: Consistent code formatting across the project
- **Husky**: Pre-commit hooks for quality assurance

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and data flow testing
- **E2E Tests**: Full user workflow validation
- **Performance Tests**: Load testing and optimization validation

## 🤝 Contributing

1. **Fork the repository** and create a feature branch
2. **Follow coding standards** with TypeScript and ESLint compliance
3. **Write comprehensive tests** for new features and bug fixes
4. **Document changes** with clear commit messages and PR descriptions
5. **Test thoroughly** across different browsers and screen sizes

### Development Guidelines
- Use semantic commit messages (feat:, fix:, docs:, etc.)
- Maintain type safety with comprehensive TypeScript interfaces
- Follow component composition patterns with proper separation of concerns
- Implement accessibility features following WCAG guidelines
- Optimize for performance with lazy loading and efficient state management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Framework**: Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- **UI Foundation**: Components powered by [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: Beautiful designs with [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: Smooth interactions by [Framer Motion](https://www.framer.com/motion/)
- **Icons**: Comprehensive icon set from [Lucide React](https://lucide.dev/)
- **AI Integration**: Natural language processing via [OpenRouter](https://openrouter.ai/)
- **File Processing**: Data handling with [ExcelJS](https://github.com/exceljs/exceljs) and [PapaParse](https://www.papaparse.com/)

---

**Data Alchemist** - Transform your data into insights with the power of AI and intelligent processing. 🚀

*Built with ❤️ for efficient data management and analysis.*

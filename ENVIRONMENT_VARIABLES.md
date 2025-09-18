# Environment Variables Configuration

This document lists all environment variables used by the AMC Math Prep application.

## File Paths Configuration

### Document Processing Scripts

| Variable | Description | Default Value | Used By |
|----------|-------------|---------------|---------|
| `AMC_FOLDER` | Path to folder containing AMC PDF files | `./uploads/amc-files` | All AMC processing scripts |
| `DOCX_PATH` | Path to DOCX document to process | `./uploads/documents/4794.docx` | DOCX processing scripts |
| `TEST_PDF` | Path to test PDF file for debugging | `./uploads/amc-files/1015559.pdf` | Debug scripts |

## Database Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |

Example:
```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

## Usage Examples

### Running Scripts with Custom Paths

```bash
# Use custom AMC folder
AMC_FOLDER="/path/to/your/amc/files" node ultimate-amc-parser.js

# Use custom DOCX file
DOCX_PATH="/path/to/your/document.docx" node parse-docx.js

# Use both custom paths
AMC_FOLDER="/custom/amc" DOCX_PATH="/custom/doc.docx" node ultimate-amc-parser.js
```

### Setting Environment Variables

#### Option 1: Create .env.local file (Recommended)
```bash
# .env.local
DATABASE_URL="postgresql://user:password@host:port/database"
AMC_FOLDER="/Users/yourname/Documents/AMC"
DOCX_PATH="/Users/yourname/Documents/amc-document.docx"
```

#### Option 2: Export in terminal
```bash
export AMC_FOLDER="/path/to/amc/files"
export DOCX_PATH="/path/to/document.docx"
```

#### Option 3: Inline with command
```bash
AMC_FOLDER="/custom/path" node script.js
```

## Default Directory Structure

If no environment variables are set, the scripts expect this structure:

```
project-root/
├── uploads/
│   ├── amc-files/          # AMC PDF files go here
│   │   ├── amc-2023.pdf
│   │   ├── amc-2024.pdf
│   │   └── New folder/     # Optional subdirectory
│   └── documents/          # DOCX files go here
│       └── 4794.docx
└── scripts...
```

## Notes

- All paths can be absolute or relative to the project root
- Windows users should use forward slashes `/` or double backslashes `\\\\` in paths
- The scripts will create directories if they don't exist (where possible)
- If a path is not found, the script will display helpful error messages
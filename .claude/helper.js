#!/usr/bin/env node

/**
 * Helper Script para Claude Code Frontend Designer Skill - Wellio Edition
 * Uso: node .claude/helper.js <comando> [opciones]
 * 
 * Comandos:
 *   - list                Listar todos los componentes del proyecto
 *   - export-tokens      Exportar design tokens Wellio a TypeScript
 *   - validate <path>    Validar si un componente sigue las reglas
 *   - help               Mostrar esta ayuda
 */

const fs = require('fs');
const path = require('path');

const SKILL_CONFIG = require('./design-skill.json');
const ROOT = process.cwd();

class ClaudeSkillHelper {
  constructor() {
    this.skill = SKILL_CONFIG;
    this.projectRoot = ROOT;
  }

  /**
   * Encuentra todos los componentes en src/components
   */
  findAllComponents() {
    const componentsDir = path.join(this.projectRoot, 'src', 'components');
    const components = [];

    const walkDir = (dir, prefix = '') => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath, prefix + file + '/');
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          components.push({
            name: file.replace(/\.(tsx|ts)$/, ''),
            path: path.relative(this.projectRoot, fullPath),
            fullPath
          });
        }
      });
    };

    walkDir(componentsDir);
    return components;
  }

  /**
   * Exporta design tokens a un archivo TypeScript
   * Prioriza kit-ui-tokens.json si existe (Wellio)
   */
  exportDesignTokens() {
    let tokens = this.skill.context.designTokens;
    let source = '.claude/design-skill.json (defaults)';

    // Intentar cargar kit-ui-tokens.json si existe
    const kitPath = path.join(this.projectRoot, 'kit-ui-tokens.json');
    if (fs.existsSync(kitPath)) {
      try {
        const kitTokens = JSON.parse(fs.readFileSync(kitPath, 'utf-8'));
        tokens = kitTokens;
        source = 'kit-ui-tokens.json (Wellio)';
        console.log('📦 Usando tokens de Wellio desde kit-ui-tokens.json');
      } catch (err) {
        console.warn('⚠️  No se pudo leer kit-ui-tokens.json, usando defaults');
      }
    }

    const output = `
/**
 * Design Tokens Wellio - Auto-generado por Claude Design Skill
 * Fuente: ${source}
 * 
 * IMPORTANTE: No edites manualmente. Regenera con:
 * npm run claude:export-tokens
 */

export const designTokens = ${JSON.stringify(tokens, null, 2)};

// Alias para MUI theme
export const colors = {
  primary: {
    light: '${tokens.colors?.primary?.light || '#E8DFFF'}',
    main: '${tokens.colors?.primary?.main || '#7C3AED'}',
    dark: '${tokens.colors?.primary?.dark || '#5B21B6'}',
    contrast: '${tokens.colors?.primary?.contrast || '#FFFFFF'}'
  },
  secondary: {
    light: '${tokens.colors?.secondary?.light || '#FED7AA'}',
    main: '${tokens.colors?.secondary?.main || '#FB923C'}',
    dark: '${tokens.colors?.secondary?.dark || '#D97706'}',
    contrast: '${tokens.colors?.secondary?.contrast || '#FFFFFF'}'
  },
  success: {
    light: '${tokens.colors?.success?.light || '#D1FAE5'}',
    main: '${tokens.colors?.success?.main || '#10B981'}',
    dark: '${tokens.colors?.success?.dark || '#047857'}',
    contrast: '${tokens.colors?.success?.contrast || '#FFFFFF'}'
  },
  error: {
    light: '${tokens.colors?.error?.light || '#FEE2E2'}',
    main: '${tokens.colors?.error?.main || '#EF4444'}',
    dark: '${tokens.colors?.error?.dark || '#DC2626'}',
    contrast: '${tokens.colors?.error?.contrast || '#FFFFFF'}'
  },
  warning: {
    light: '${tokens.colors?.warning?.light || '#FEF3C7'}',
    main: '${tokens.colors?.warning?.main || '#F59E0B'}',
    dark: '${tokens.colors?.warning?.dark || '#D97706'}',
    contrast: '${tokens.colors?.warning?.contrast || '#FFFFFF'}'
  },
  info: {
    light: '${tokens.colors?.info?.light || '#DBEAFE'}',
    main: '${tokens.colors?.info?.main || '#3B82F6'}',
    dark: '${tokens.colors?.info?.dark || '#1D4ED8'}',
    contrast: '${tokens.colors?.info?.contrast || '#FFFFFF'}'
  },
  neutral: {
    light: '${tokens.colors?.neutral?.light || '#F3F4F6'}',
    main: '${tokens.colors?.neutral?.main || '#D1D5DB'}',
    dark: '${tokens.colors?.neutral?.dark || '#6B7280'}'
  },
  background: '${tokens.colors?.background || '#FFFFFF'}',
  surface: '${tokens.colors?.surface || '#F9FAFB'}',
  border: '${tokens.colors?.border || '#E5E7EB'}'
};

export const spacing = {
  xs: '${tokens.spacing?.xs || '4px'}',
  sm: '${tokens.spacing?.sm || '8px'}',
  md: '${tokens.spacing?.md || '16px'}',
  lg: '${tokens.spacing?.lg || '24px'}',
  xl: '${tokens.spacing?.xl || '32px'}',
  '2xl': '${tokens.spacing?.['2xl'] || '48px'}'
};

export const typography = {
  fontFamily: '${tokens.typography?.fonts?.primary || 'Inter, sans-serif'}',
  variants: ${JSON.stringify(tokens.typography?.variants || {}, null, 2)}
};

export const borderRadius = {
  small: '${tokens.borderRadius?.small || '4px'}',
  medium: '${tokens.borderRadius?.medium || '8px'}',
  large: '${tokens.borderRadius?.large || '12px'}',
  full: '${tokens.borderRadius?.full || '999px'}'
};

export const shadows = {
  sm: '${tokens.shadows?.sm || '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}',
  md: '${tokens.shadows?.md || '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}',
  lg: '${tokens.shadows?.lg || '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}',
  xl: '${tokens.shadows?.xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}'
};

// Componentes
export const components = ${JSON.stringify(tokens.components || {}, null, 2)};
`;

    const outputPath = path.join(this.projectRoot, 'src', 'constants', 'designTokens.ts');
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, output);
    console.log(`✅ Design tokens Wellio exportados a: src/constants/designTokens.ts`);
    return outputPath;
  }

  /**
   * Valida si un componente sigue las convenciones del skill
   */
  validateComponent(componentPath) {
    const fullPath = path.join(this.projectRoot, componentPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo no encontrado: ${componentPath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const issues = [];

    // Validaciones
    const checks = [
      {
        name: 'Importa de MUI',
        test: () => content.includes("from '@mui/material'") || content.includes("from 'package:@mui/material'"),
        severity: 'error'
      },
      {
        name: 'NO usa styled-components',
        test: () => !content.includes("from 'styled-components'") && !content.includes('styled('),
        severity: 'error'
      },
      {
        name: 'NO usa Tailwind',
        test: () => !content.includes('className=') || !content.match(/className=['"].*[a-z]+\s/),
        severity: 'error'
      },
      {
        name: 'Usa TypeScript (tipos explícitos)',
        test: () => content.includes('interface ') || content.includes('type ') || content.includes(': {'),
        severity: 'warning'
      },
      {
        name: 'Usa sx prop de MUI',
        test: () => content.includes('sx={{') || content.includes('sx={'),
        severity: 'warning'
      },
      {
        name: 'Tiene export default o named export',
        test: () => content.includes('export function') || content.includes('export const') || content.includes('export default'),
        severity: 'error'
      }
    ];

    checks.forEach(check => {
      if (!check.test()) {
        issues.push({
          severity: check.severity,
          message: `${check.severity === 'error' ? '❌' : '⚠️'} ${check.name}`
        });
      }
    });

    console.log(`\n📋 Validación: ${componentPath}`);
    if (issues.length === 0) {
      console.log('✅ Componente válido');
      return true;
    } else {
      issues.forEach(issue => console.log(issue.message));
      const errors = issues.filter(i => i.severity === 'error');
      return errors.length === 0;
    }
  }

  /**
   * Genera un template para un nuevo componente
   */
  generateComponentTemplate(componentName, type = 'simple') {
    const templates = {
      simple: `import { Box, Card, CardContent, Typography } from '@mui/material';

interface ${componentName}Props {
  // Agrega props aquí
}

export function ${componentName}({}: ${componentName}Props) {
  return (
    <Card sx={{ maxWidth: 320 }}>
      <CardContent>
        <Typography variant="h6">
          ${componentName}
        </Typography>
      </CardContent>
    </Card>
  );
}`,

      form: `import { Box, TextField, Button } from '@mui/material';
import { useForm } from 'react-hook-form';

interface ${componentName}Props {
  onSubmit: (data: any) => void;
}

export function ${componentName}({ onSubmit }: ${componentName}Props) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <TextField
        label="Name"
        {...register('name', { required: 'Required' })}
        error={!!errors.name}
        helperText={errors.name?.message}
      />
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Box>
  );
}`,

      table: `import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface ${componentName}Props {
  data: any[];
}

export function ${componentName}({ data }: ${componentName}Props) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.light' }}>
            <TableCell>Column 1</TableCell>
            <TableCell>Column 2</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.col1}</TableCell>
              <TableCell>{row.col2}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}`
    };

    const template = templates[type] || templates.simple;
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(this.projectRoot, 'src', 'components', 'common', fileName);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    console.log(`✅ Componente creado: src/components/common/${fileName}`);
    return filePath;
  }

  /**
   * Muestra la configuración actual del skill
   */
  showConfig() {
    console.log('\n📐 Configuración: Frontend Designer Skill - Wellio\n');
    console.log('🎨 Brand:', this.skill.brand?.name);
    console.log('Stack:', JSON.stringify(this.skill.context.stack, null, 2));
    console.log('\n🏗️ Arquitectura:', this.skill.context.architecture.pattern);
    this.skill.context.architecture.layers.forEach((layer, i) => {
      console.log(`  ${i + 1}. ${layer.name}: ${layer.description}`);
    });
    console.log('\n🎯 Colores Wellio:');
    console.log('  Primary:', this.skill.context.designTokens.colors.primary.main);
    console.log('  Secondary:', this.skill.context.designTokens.colors.secondary.main);
    console.log('  Success:', this.skill.context.designTokens.colors.success.main);
    console.log('  Error:', this.skill.context.designTokens.colors.error.main);
    console.log('\n✍️ Font Family:', this.skill.context.designTokens.typography.fontFamily);
    console.log('📏 Spacing Scale:', Object.keys(this.skill.context.designTokens.spacing));
  }

  /**
   * Muestra ayuda
   */
  showHelp() {
    console.log(`
📚 Claude Code Frontend Designer Skill - Helper Commands

Uso: node .claude/helper.js <comando> [opciones]

Comandos disponibles:

  list                    Listar todos los componentes del proyecto
  export-tokens          Exportar design tokens Wellio a TypeScript
  validate <path>        Validar si un componente sigue las convenciones
  generate <name> [type] Generar nuevo componente (simple, form, table)
  config                 Mostrar configuración actual del skill
  help                   Mostrar esta ayuda

Ejemplos:

  node .claude/helper.js list
  node .claude/helper.js export-tokens
  node .claude/helper.js validate src/components/common/UserCard.tsx
  node .claude/helper.js generate Dashboard simple
  node .claude/helper.js generate LoginForm form
  node .claude/helper.js generate UserTable table
  node .claude/helper.js config

Para usar con npm scripts (agregados en package.json):

  npm run claude:list
  npm run claude:export-tokens
  npm run claude:validate src/components/MyComponent.tsx
  npm run claude:help
    `);
  }

  run(args) {
    const [command, ...params] = args;

    switch (command) {
      case 'list':
      case 'list-components':
        const components = this.findAllComponents();
        console.log(`\n📦 Componentes encontrados (${components.length}):\n`);
        components.forEach(c => console.log(`  ${c.path}`));
        break;

      case 'export-tokens':
        this.exportDesignTokens();
        break;

      case 'validate':
        if (!params[0]) {
          console.error('❌ Especifica la ruta del componente');
          console.log('Uso: node .claude/helper.js validate <path>');
          break;
        }
        this.validateComponent(params[0]);
        break;

      case 'generate':
        if (!params[0]) {
          console.error('❌ Especifica el nombre del componente');
          console.log('Uso: node .claude/helper.js generate <name> [type]');
          break;
        }
        this.generateComponentTemplate(params[0], params[1]);
        break;

      case 'config':
        this.showConfig();
        break;

      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;

      default:
        console.error(`❌ Comando no reconocido: ${command}`);
        this.showHelp();
    }
  }
}

// Ejecutar
const helper = new ClaudeSkillHelper();
helper.run(process.argv.slice(2));
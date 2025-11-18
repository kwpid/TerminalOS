import { WindowState, WindowInfo, WindowLibrary } from "./schema";

export interface FluxoContext {
  windows: WindowState[];
  variables: Map<string, any>;
  exports: Map<string, FluxoFunction>;
  output: string[];
}

export interface FluxoFunction {
  params: string[];
  body: string;
}

export class FluxoInterpreter {
  private context: FluxoContext;
  private windows: WindowState[];

  constructor(windows: WindowState[]) {
    this.windows = windows;
    this.context = {
      windows,
      variables: new Map(),
      exports: new Map(),
      output: [],
    };
  }

  execute(code: string): string {
    try {
      this.parseAndExecute(code);
      return this.context.output.join('\n') || 'Script executed successfully (no output)';
    } catch (error) {
      return `Fluxo Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private parseAndExecute(code: string) {
    const tokens = this.tokenize(code);
    this.executeTokens(tokens);
  }

  private tokenize(code: string): string[] {
    const lines: string[] = [];
    const codeLines = code.split('\n');
    
    for (const line of codeLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        lines.push(line);
      }
    }
    
    return lines;
  }

  private executeTokens(tokens: string[]) {
    let i = 0;
    while (i < tokens.length) {
      const line = tokens[i].trim();
      
      if (line.startsWith('local ')) {
        i += this.executeLocalDeclaration(line, tokens, i);
      } else if (line.startsWith('export function ')) {
        i += this.parseExportFunction(tokens, i);
      } else if (line.includes('sys.log(')) {
        this.executeSysLog(line);
        i++;
      } else if (this.isExportedFunctionCall(line)) {
        this.executeExportedFunction(line);
        i++;
      } else {
        i++;
      }
    }
  }

  private executeLocalDeclaration(line: string, allTokens: string[], currentIndex: number): number {
    const match = line.match(/local\s+(\w+)\s*=\s*(.+)/);
    if (!match) {
      throw new Error(`Invalid local declaration: ${line}`);
    }

    const [, varName, expression] = match;
    
    if (expression.includes('{')) {
      const blockResult = this.evaluateBlockExpression(expression, allTokens, currentIndex);
      this.context.variables.set(varName, blockResult.value);
      return blockResult.linesConsumed;
    } else {
      const value = this.evaluateExpression(expression.trim());
      this.context.variables.set(varName, value);
      return 1;
    }
  }

  private evaluateBlockExpression(expression: string, allTokens: string[], startIndex: number): { value: any, linesConsumed: number } {
    const blockStart = expression.indexOf('{');
    const prefix = expression.substring(0, blockStart).trim();
    
    let blockContent = '';
    let braceCount = 0;
    let i = startIndex;
    let foundStart = false;
    
    while (i < allTokens.length) {
      const line = allTokens[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        }
        if (char === '}') braceCount--;
      }
      
      if (foundStart) {
        blockContent += line + '\n';
      }
      
      if (foundStart && braceCount === 0) {
        break;
      }
      
      i++;
    }
    
    const innerContent = this.extractBlockContent(blockContent);
    const result = this.evaluateBlockContent(prefix, innerContent);
    
    return {
      value: result,
      linesConsumed: i - startIndex + 1
    };
  }

  private extractBlockContent(blockText: string): string {
    const firstBrace = blockText.indexOf('{');
    const lastBrace = blockText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return '';
    return blockText.substring(firstBrace + 1, lastBrace).trim();
  }

  private evaluateBlockContent(prefix: string, content: string): any {
    const trimmedContent = content.trim();
    
    if (trimmedContent.includes(':find(')) {
      const colonCallMatch = trimmedContent.match(/(\w+)\.(\w+):find\(([^)]+)\)/);
      if (colonCallMatch) {
        const [, varName, method, arg] = colonCallMatch;
        const windowObj = this.context.variables.get(varName);
        const findArg = arg.replace(/['"]/g, '').trim();
        
        if (windowObj && (windowObj.libary || windowObj.library)) {
          const libObj = windowObj.libary || windowObj.library;
          if (typeof libObj.find === 'function') {
            return libObj.find(findArg);
          }
        }
      }
    }
    
    return null;
  }

  private evaluateExpression(expr: string): any {
    if (expr.startsWith('window_Id(')) {
      const match = expr.match(/window_Id\(([^)]+)\)/);
      if (match) {
        const windowIdPattern = match[1].replace(/['"]/g, '').trim();
        const window = this.resolveWindowId(windowIdPattern);
        if (!window) {
          throw new Error(`Window ${windowIdPattern} not found`);
        }
        return this.createWindowObject(window);
      }
    }

    if (expr.includes(':') && expr.includes('(')) {
      return this.evaluateColonMethodCall(expr);
    }

    if (expr.includes('.info:(')) {
      return this.evaluateInfoCall(expr);
    }

    if (expr.startsWith('"') || expr.startsWith("'")) {
      return expr.replace(/['"]/g, '');
    }

    if (expr === 'null') {
      return null;
    }

    if (this.context.variables.has(expr)) {
      return this.context.variables.get(expr);
    }

    return expr;
  }

  private evaluateColonMethodCall(expr: string): any {
    const colonCallMatch = expr.match(/(\w+)\.(\w+):(\w+)\(([^)]*)\)/);
    if (!colonCallMatch) return expr;

    const [, varName, property, method, argsStr] = colonCallMatch;
    const obj = this.context.variables.get(varName);
    
    if (!obj || !obj[property]) {
      return null;
    }

    const methodTarget = obj[property];
    if (!methodTarget || typeof methodTarget[method] !== 'function') {
      return null;
    }

    const args = argsStr.split(',').map(arg => {
      const trimmed = arg.trim();
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        return trimmed.replace(/['"]/g, '');
      }
      return this.context.variables.get(trimmed) || trimmed;
    });

    return methodTarget[method](...args);
  }

  private resolveWindowId(pattern: string): WindowState | null {
    if (pattern.startsWith('window-')) {
      const num = pattern.replace('window-', '');
      if (num === '11' || num === '1') {
        return this.windows[0] || null;
      }
    }
    
    const exactMatch = this.windows.find(w => w.id === pattern);
    if (exactMatch) return exactMatch;
    
    const titleMatch = this.windows.find(w => 
      w.title.toLowerCase().includes('vsstudio') || 
      w.appType === 'vsstudio'
    );
    if (titleMatch) return titleMatch;
    
    return this.windows[0] || null;
  }

  private createWindowObject(window: WindowState) {
    return {
      id: window.id,
      info: (data: any) => this.getWindowInfo(window, data),
      libary: {
        find: (key: string) => this.findInLibrary(window, key),
      },
      library: {
        find: (key: string) => this.findInLibrary(window, key),
      },
      database: {
        write: (key: string, value: any) => {
          if (!window.data) {
            window.data = {};
          }
          window.data[key] = value;
          return { success: true, key, value };
        },
        read: (key: string) => {
          return window.data?.[key] || null;
        },
      },
    };
  }

  private getWindowInfo(window: WindowState, data: any): any {
    const lib = window.library || this.initializeDefaultLibrary(window);
    return {
      id: window.id,
      title: window.title,
      appType: window.appType,
      library: lib,
      libary: lib,
      data: data || window.data,
    };
  }

  private findInLibrary(window: WindowState, key: string): any {
    if (!window.library) {
      window.library = this.initializeDefaultLibrary(window);
    }
    return window.library[key] || null;
  }

  private initializeDefaultLibrary(window: WindowState): WindowLibrary {
    return {
      mainSection: {
        name: "mainSection",
        type: "section",
        content: `Main section for window ${window.id}`,
      },
      crossSection: {
        name: "crossSection",
        type: "section",
        data: {
          x: 0,
          y: 0,
          width: window.size.width,
          height: window.size.height,
        },
      },
      components: [],
    };
  }

  private evaluateInfoCall(expr: string): any {
    const varName = expr.split('.')[0];
    const windowObj = this.context.variables.get(varName);
    
    if (!windowObj || typeof windowObj.info !== 'function') {
      throw new Error(`${varName} is not a valid window object`);
    }

    const match = expr.match(/info:\(([^)]*)\)/);
    const arg = match ? match[1].trim() : 'null';
    const argValue = arg === 'null' ? null : this.context.variables.get(arg);
    
    return windowObj.info(argValue);
  }

  private resolveVariablePath(path: string): any {
    const parts = path.split('.');
    let current = this.context.variables.get(parts[0]);

    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object') {
        current = current[parts[i]];
      } else {
        return null;
      }
    }

    return current;
  }

  private parseExportFunction(allTokens: string[], startIndex: number): number {
    const firstLine = allTokens[startIndex].trim();
    const match = firstLine.match(/export\s+function\s+(\w+)\s*\(([^)]*)\)/);
    
    if (!match) {
      throw new Error(`Invalid export function: ${firstLine}`);
    }

    const [, funcName, paramsStr] = match;
    const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);

    let body = '';
    let braceCount = 0;
    let i = startIndex;
    let foundStart = false;

    while (i < allTokens.length) {
      const line = allTokens[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        }
        if (char === '}') braceCount--;
      }

      if (foundStart) {
        body += line + '\n';
      }

      if (foundStart && braceCount === 0) {
        break;
      }

      i++;
    }

    this.context.exports.set(funcName, { params, body });
    return i - startIndex + 1;
  }

  private isExportedFunctionCall(line: string): boolean {
    const match = line.match(/(\w+)\s*\(/);
    if (!match) return false;
    return this.context.exports.has(match[1]);
  }

  private executeExportedFunction(line: string) {
    const match = line.match(/(\w+)\s*\((.*)\)/);
    if (!match) return;

    const [, funcName] = match;
    const func = this.context.exports.get(funcName);

    if (!func) return;

    const bodyContent = this.extractBlockContent(func.body);
    const bodyLines = bodyContent.split('\n').filter(l => l.trim());
    
    for (const bodyLine of bodyLines) {
      const trimmed = bodyLine.trim();
      if (trimmed && trimmed !== '{' && trimmed !== '}') {
        if (trimmed.startsWith('local ')) {
          this.executeLocalDeclaration(trimmed, bodyLines, 0);
        } else if (trimmed.includes('sys.log(')) {
          this.executeSysLog(trimmed);
        } else if (trimmed.startsWith('return ')) {
          const returnExpr = trimmed.substring(7).trim();
          const returnValue = this.evaluateExpression(returnExpr);
          this.context.output.push(`Return: ${typeof returnValue === 'object' ? JSON.stringify(returnValue) : returnValue}`);
        } else if (trimmed.match(/^\w+\s*\(/)) {
          const callMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)/);
          if (callMatch) {
            const [, callFuncName, argsStr] = callMatch;
            const args = argsStr.split(',').map(a => {
              const argTrimmed = a.trim();
              return this.context.variables.get(argTrimmed) || argTrimmed;
            });
            this.context.output.push(`Called ${callFuncName} with: ${JSON.stringify(args)}`);
          }
        }
      }
    }
  }

  private executeSysLog(line: string) {
    const match = line.match(/sys\.log\s*\(([^)]+)\)/);
    if (!match) return;

    const args = match[1].split(',').map(arg => {
      const trimmed = arg.trim();
      
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        return trimmed.replace(/['"]/g, '');
      }

      const value = this.context.variables.get(trimmed) || this.resolveVariablePath(trimmed);
      if (value !== undefined && value !== null) {
        return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      }

      return trimmed.replace(/['"]/g, '');
    });

    this.context.output.push(args.join(' '));
  }
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TechRule } from '../types';

import nodeRule from '../../rules/node.json';
import reactRule from '../../rules/react.json';
import nextRule from '../../rules/next.json';
import vueRule from '../../rules/vue.json';
import angularRule from '../../rules/angular.json';
import expressRule from '../../rules/express.json';
import pythonRule from '../../rules/python.json';
import djangoRule from '../../rules/django.json';
import flaskRule from '../../rules/flask.json';
import fastapiRule from '../../rules/fastapi.json';
import flutterRule from '../../rules/flutter.json';
import androidRule from '../../rules/android.json';
import springBootRule from '../../rules/spring-boot.json';
import goRule from '../../rules/go.json';
import javascriptRule from '../../rules/javascript.json';
import typescriptRule from '../../rules/typescript.json';
import javaRule from '../../rules/java.json';
import kotlinRule from '../../rules/kotlin.json';
import dartRule from '../../rules/dart.json';

export const BUILTIN_RULES: TechRule[] = [
  nodeRule as TechRule,
  reactRule as TechRule,
  nextRule as TechRule,
  vueRule as TechRule,
  angularRule as TechRule,
  expressRule as TechRule,
  pythonRule as TechRule,
  djangoRule as TechRule,
  flaskRule as TechRule,
  fastapiRule as TechRule,
  flutterRule as TechRule,
  androidRule as TechRule,
  springBootRule as TechRule,
  goRule as TechRule,
  javascriptRule as TechRule,
  typescriptRule as TechRule,
  javaRule as TechRule,
  kotlinRule as TechRule,
  dartRule as TechRule,
];

export function loadAllRules(customRulesDir?: string): TechRule[] {
  const rulesMap = new Map<string, TechRule>();

  for (const rule of BUILTIN_RULES) {
    rulesMap.set(rule.id, rule);
  }

  if (customRulesDir && fs.existsSync(customRulesDir)) {
    try {
      const files = fs.readdirSync(customRulesDir);
      for (const f of files) {
        if (f.endsWith('.json')) {
          const content = fs.readFileSync(path.join(customRulesDir, f), 'utf8');
          const parsed = JSON.parse(content) as TechRule;
          if (parsed.id && Array.isArray(parsed.signals)) {
            rulesMap.set(parsed.id, parsed);
          }
        }
      }
    } catch {
      // Fallback to built-in rules if custom dir fails
    }
  }

  return Array.from(rulesMap.values());
}

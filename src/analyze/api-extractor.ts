import { ApiEndpoint, ScanResult } from '../types';
import { readTextFileSafe } from '../scanner/reader';

export function extractApiEndpoints(scan: ScanResult): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const MAX_ENDPOINTS = 20;

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling');
  for (const file of validFiles) {
    if (file.isDirectory || file.size > 500 * 1024) continue;
    if (!/\.(js|ts|jsx|tsx|py|go|java|kt)$/i.test(file.path)) continue;

    const res = readTextFileSafe(file.absolutePath, file.path);
    if (!res.content) continue;

    const lines = res.content.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      if (endpoints.length >= MAX_ENDPOINTS) break;
      const line = lines[idx].trim();
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*') || line.startsWith('#')) continue;

      // Express routes: app.get('/path', ...) or router.post('/path', ...)
      const expressMatch = line.match(/(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (expressMatch) {
        endpoints.push({
          method: expressMatch[1].toUpperCase(),
          path: expressMatch[2],
          file: file.path,
          line: idx + 1,
        });
        continue;
      }

      // FastAPI routes: @app.get('/path') or @router.post('/path')
      const fastapiMatch = line.match(/@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (fastapiMatch) {
        endpoints.push({
          method: fastapiMatch[1].toUpperCase(),
          path: fastapiMatch[2],
          file: file.path,
          line: idx + 1,
        });
        continue;
      }

      // Flask routes: @app.route('/path', methods=['GET', 'POST'])
      const flaskMatch = line.match(/@(?:app|bp|blueprint)\.route\s*\(\s*['"`]([^'"`]+)['"`](?:.*?methods\s*=\s*\[([^\]]+)\])?/i);
      if (flaskMatch) {
        const routePath = flaskMatch[1];
        const methodsRaw = flaskMatch[2] || "'GET'";
        const methods = methodsRaw.replace(/['"\s]/g, '').split(',');
        for (const m of methods) {
          if (endpoints.length >= MAX_ENDPOINTS) break;
          endpoints.push({
            method: m.toUpperCase(),
            path: routePath,
            file: file.path,
            line: idx + 1,
          });
        }
        continue;
      }

      // Django urls: path('api/users/', views.UserList.as_view())
      const djangoMatch = line.match(/path\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (djangoMatch && file.path.endsWith('urls.py')) {
        endpoints.push({
          method: 'GET/POST',
          path: '/' + djangoMatch[1].replace(/^\//, ''),
          file: file.path,
          line: idx + 1,
        });
        continue;
      }

      // Go routes: router.GET("/path", ...) or r.HandleFunc("/path", ...)
      const goMatch = line.match(/(?:router|r|e|g)\.(GET|POST|PUT|DELETE|PATCH|HandleFunc)\s*\(\s*["`]([^"`]+)["`]/);
      if (goMatch) {
        const method = goMatch[1] === 'HandleFunc' ? 'GET' : goMatch[1].toUpperCase();
        endpoints.push({
          method,
          path: goMatch[2],
          file: file.path,
          line: idx + 1,
        });
        continue;
      }

      // Spring Boot routes: @GetMapping("/path") or @PostMapping("/path")
      const springMatch = line.match(/@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*(?:value\s*=\s*)?["`']([^"`']+)["`']/i);
      if (springMatch) {
        const method = springMatch[1] === 'Request' ? 'GET' : springMatch[1].toUpperCase();
        endpoints.push({
          method,
          path: springMatch[2],
          file: file.path,
          line: idx + 1,
        });
        continue;
      }
    }
  }

  return endpoints;
}

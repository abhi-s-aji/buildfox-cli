import { DetectedTechnology, ProjectCommand, ScanResult } from '../types';
import { readTextFileSafe } from '../scanner/reader';

export function detectProjectCommands(
  scan: ScanResult,
  technologies: DetectedTechnology[],
  packageManager = 'npm'
): ProjectCommand[] {
  const commands: ProjectCommand[] = [];
  const techIds = new Set(technologies.map((t) => t.id));

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling' || f.scope === 'test' || f.scope === 'generated');

  // 1. Inspect package.json scripts for Node / React / Next / Vue / Angular / Express
  const pkgEntry = validFiles.find((f) => f.path === 'package.json');
  if (pkgEntry) {
    const res = readTextFileSafe(pkgEntry.absolutePath, pkgEntry.path);
    if (res.content) {
      try {
        const pkg = JSON.parse(res.content);
        if (pkg.scripts && typeof pkg.scripts === 'object') {
          const scripts = pkg.scripts;
          const pm = packageManager;

          // Check install
          commands.push({
            name: 'install',
            command: `${pm} install`,
            description: 'Install dependencies',
            category: 'install',
          });

          for (const [scriptName, scriptCmd] of Object.entries<string>(scripts)) {
            let category: ProjectCommand['category'] = 'other';
            if (['dev', 'start', 'serve'].includes(scriptName)) category = 'run';
            else if (['build', 'compile'].includes(scriptName)) category = 'build';
            else if (['test', 'test:unit', 'test:e2e'].includes(scriptName)) category = 'test';
            else if (['lint', 'format'].includes(scriptName)) category = 'lint';

            const runCmd =
              pm === 'npm'
                ? scriptName === 'start' || scriptName === 'test'
                  ? `npm ${scriptName}`
                  : `npm run ${scriptName}`
                : `${pm} ${scriptName}`;

            commands.push({
              name: scriptName,
              command: runCmd,
              description: `Run script "${scriptName}" (${scriptCmd})`,
              category,
            });
          }
        }
      } catch {
        // Ignore parse error
      }
    }
  }

  // 2. Go Commands
  if (techIds.has('go')) {
    const mainGo = validFiles.find((f) => f.path === 'main.go' || f.path === 'cmd/main.go');
    if (mainGo) {
      commands.push({
        name: 'run',
        command: `go run ${mainGo.path}`,
        description: 'Run main application',
        category: 'run',
      });
    }
    if (validFiles.some((f) => f.path.endsWith('_test.go'))) {
      commands.push({
        name: 'test',
        command: 'go test ./...',
        description: 'Run unit tests',
        category: 'test',
      });
    }
    commands.push({
      name: 'build',
      command: 'go build -o app',
      description: 'Build binary',
      category: 'build',
    });
  }

  // 3. Python / Django / Flask / FastAPI Commands
  if (techIds.has('python') || techIds.has('django') || techIds.has('flask') || techIds.has('fastapi')) {
    if (scan.fileMap.has('requirements.txt')) {
      commands.push({
        name: 'install',
        command: 'pip install -r requirements.txt',
        description: 'Install Python dependencies',
        category: 'install',
      });
    } else if (scan.fileMap.has('pyproject.toml')) {
      commands.push({
        name: 'install',
        command: 'poetry install',
        description: 'Install dependencies with Poetry',
        category: 'install',
      });
    }

    if (techIds.has('django') && scan.fileMap.has('manage.py')) {
      commands.push({
        name: 'run',
        command: 'python manage.py runserver',
        description: 'Start Django development server',
        category: 'run',
      });
      commands.push({
        name: 'test',
        command: 'python manage.py test',
        description: 'Run Django test suite',
        category: 'test',
      });
    } else if (techIds.has('fastapi')) {
      const entry = scan.fileMap.has('main.py') ? 'main:app' : scan.fileMap.has('app/main.py') ? 'app.main:app' : 'app:app';
      commands.push({
        name: 'run',
        command: `uvicorn ${entry} --reload`,
        description: 'Start FastAPI server with live reload',
        category: 'run',
      });
    } else if (techIds.has('flask')) {
      commands.push({
        name: 'run',
        command: 'flask run',
        description: 'Start Flask server',
        category: 'run',
      });
    }

    if (validFiles.some((f) => f.path.includes('test') && f.path.endsWith('.py'))) {
      if (!commands.some((c) => c.name === 'test')) {
        commands.push({
          name: 'test',
          command: 'pytest',
          description: 'Run tests with Pytest',
          category: 'test',
        });
      }
    }
  }

  // 4. Flutter Commands
  if (techIds.has('flutter')) {
    commands.push({
      name: 'install',
      command: 'flutter pub get',
      description: 'Fetch Flutter dependencies',
      category: 'install',
    });
    commands.push({
      name: 'run',
      command: 'flutter run',
      description: 'Run application on connected device/emulator',
      category: 'run',
    });
    if (validFiles.some((f) => f.path.startsWith('test/'))) {
      commands.push({
        name: 'test',
        command: 'flutter test',
        description: 'Run Flutter unit and widget tests',
        category: 'test',
      });
    }
  }

  // 5. Android Commands
  if (techIds.has('android') && !techIds.has('flutter')) {
    const wrapper = scan.fileMap.has('gradlew') ? './gradlew' : 'gradle';
    commands.push({
      name: 'build',
      command: `${wrapper} assembleDebug`,
      description: 'Build debug APK',
      category: 'build',
    });
    commands.push({
      name: 'test',
      command: `${wrapper} test`,
      description: 'Run Android unit tests',
      category: 'test',
    });
  }

  // 6. Spring Boot Commands
  if (techIds.has('spring-boot')) {
    if (scan.fileMap.has('mvnw')) {
      commands.push({
        name: 'run',
        command: './mvnw spring-boot:run',
        description: 'Run Spring Boot application with Maven',
        category: 'run',
      });
      commands.push({
        name: 'test',
        command: './mvnw test',
        description: 'Run unit tests',
        category: 'test',
      });
    } else if (scan.fileMap.has('gradlew')) {
      commands.push({
        name: 'run',
        command: './gradlew bootRun',
        description: 'Run Spring Boot application with Gradle',
        category: 'run',
      });
    }
  }

  return commands;
}

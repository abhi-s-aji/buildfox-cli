#!/bin/bash
set -e

DIR="tests/fixtures"

# 1. JS
echo '{"name":"js-proj","dependencies":{}}' > $DIR/detect-js/package.json
echo 'console.log("hello");' > $DIR/detect-js/index.js

# 2. TS
echo '{"name":"ts-proj","dependencies":{}}' > $DIR/detect-ts/package.json
echo '{"compilerOptions":{}}' > $DIR/detect-ts/tsconfig.json
echo 'const a: string = "hello";' > $DIR/detect-ts/index.ts

# 3. React + TS
echo '{"name":"react-ts","dependencies":{"react":"^18","react-dom":"^18"}}' > $DIR/detect-react/package.json
echo '{"compilerOptions":{}}' > $DIR/detect-react/tsconfig.json
mkdir -p $DIR/detect-react/src
echo 'import React from "react"; export const App = () => <div></div>;' > $DIR/detect-react/src/App.tsx

# 4. Next.js + TS
echo '{"name":"next-ts","dependencies":{"next":"^13","react":"^18"}}' > $DIR/detect-next/package.json
echo '{"compilerOptions":{}}' > $DIR/detect-next/tsconfig.json
echo 'module.exports = {};' > $DIR/detect-next/next.config.js
mkdir -p $DIR/detect-next/src/app
echo 'export default function Page() {}' > $DIR/detect-next/src/app/page.tsx

# 5. Vue
echo '{"name":"vue-proj","dependencies":{"vue":"^3"}}' > $DIR/detect-vue/package.json
mkdir -p $DIR/detect-vue/src
echo '<template></template>' > $DIR/detect-vue/src/App.vue

# 6. Angular
echo '{"name":"ng-proj","dependencies":{"@angular/core":"^15"}}' > $DIR/detect-angular/package.json
echo '{}' > $DIR/detect-angular/angular.json
mkdir -p $DIR/detect-angular/src
echo 'export class App {}' > $DIR/detect-angular/src/main.ts

# 7. Express
echo '{"name":"exp-proj","dependencies":{"express":"^4"}}' > $DIR/detect-express/package.json
echo 'const express = require("express");' > $DIR/detect-express/server.js

# 8. Python
echo 'requests==2.28' > $DIR/detect-python/requirements.txt
echo 'import requests' > $DIR/detect-python/main.py

# 9. Django
echo 'Django==4.2' > $DIR/detect-django/requirements.txt
echo 'import django' > $DIR/detect-django/manage.py
mkdir -p $DIR/detect-django/app
echo 'from django.db import models' > $DIR/detect-django/app/models.py

# 10. Flask
echo 'Flask==2.0' > $DIR/detect-flask/requirements.txt
echo 'from flask import Flask' > $DIR/detect-flask/app.py

# 11. FastAPI
echo 'fastapi==0.95\nuvicorn==0.20' > $DIR/detect-fastapi/requirements.txt
echo 'from fastapi import FastAPI' > $DIR/detect-fastapi/main.py

# 12. Go
echo 'module test/go' > $DIR/detect-go/go.mod
echo 'package main' > $DIR/detect-go/main.go

# 13. Java
echo '<project></project>' > $DIR/detect-java/pom.xml
mkdir -p $DIR/detect-java/src/main/java
echo 'public class Main {}' > $DIR/detect-java/src/main/java/Main.java

# 14. Spring Boot
echo '<project><dependencies><dependency><groupId>org.springframework.boot</groupId></dependency></dependencies></project>' > $DIR/detect-springboot/pom.xml
mkdir -p $DIR/detect-springboot/src/main/java
echo 'import org.springframework.boot.SpringApplication;' > $DIR/detect-springboot/src/main/java/App.java

# 15. Kotlin
echo 'plugins { kotlin("jvm") }' > $DIR/detect-kotlin/build.gradle.kts
mkdir -p $DIR/detect-kotlin/src/main/kotlin
echo 'fun main() {}' > $DIR/detect-kotlin/src/main/kotlin/Main.kt

# 16. Android Kotlin
echo 'plugins { id("com.android.application") }' > $DIR/detect-android/build.gradle
mkdir -p $DIR/detect-android/app/src/main/java/com/example
echo '<manifest></manifest>' > $DIR/detect-android/app/src/main/AndroidManifest.xml
echo 'package com.example' > $DIR/detect-android/app/src/main/java/com/example/MainActivity.kt

# 17. Dart
echo 'name: dart_proj' > $DIR/detect-dart/pubspec.yaml
mkdir -p $DIR/detect-dart/lib
echo 'void main() {}' > $DIR/detect-dart/lib/main.dart

# 18. Flutter
echo -e 'name: flut_proj\ndependencies:\n  flutter:\n    sdk: flutter' > $DIR/detect-flutter/pubspec.yaml
mkdir -p $DIR/detect-flutter/lib
echo 'import "package:flutter/material.dart";' > $DIR/detect-flutter/lib/main.dart

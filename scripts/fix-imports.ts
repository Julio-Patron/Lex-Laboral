import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.getSourceFiles().forEach(sourceFile => {
  sourceFile.fixUnusedIdentifiers();
  sourceFile.organizeImports();
});

project.saveSync();

/* eslint-disable no-console */
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const chalk = require("chalk");
const packageJsonPath = path.resolve(__dirname, "package.json");
const parsedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const fileName = "package-urls.txt";
const { dependencies = {}, devDependencies = {} } = parsedPackageJson;
const allDependencies = [
  ...Object.keys(dependencies),
  ...Object.keys(devDependencies)
];

console.log(chalk.cyan("Finding package repo urls..."));

const promises = [];

allDependencies.forEach(dependency => {
  promises.push(
    new Promise((resolve, reject) => {
      const getDependencyUrl = spawn(
        "npm",
        ["view", dependency, "repository.url"],
        {
          encoding: "utf"
        }
      );

      getDependencyUrl.stdout.on("data", data => {
        let url = data.toString();
        url = url.replace("git+https", "https");
        url = url.replace("git:", "https:");
        url = url.replace("git+ssh:", "https:");
        url = url.replace(".git", "");
        url = url.replace("git@github.com", "github.com");
        console.log(`resolved ${dependency} to ${url}`);
        resolve(url);
      });

      getDependencyUrl.on("error", error => {
        console.log(error.toString());
        resolve();
      });

      getDependencyUrl.on("close", code => {
        resolve();
      });
    })
  );
});

Promise.all(promises).then(urls => {
  const filterEmptyValues = urls.filter(url => url !== undefined);

  console.log(filterEmptyValues);

  fs.writeFile(fileName, filterEmptyValues.join("\n"), err => {
    if (err) throw err;
    const packageUrlPath = path.resolve(__dirname, `${fileName}`);
    console.log(chalk.green(`File saved to ${packageUrlPath}!`));
    process.exit(0);
  });
});

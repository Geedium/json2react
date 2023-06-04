import http from "http";
import fs from "fs";

import { traverse, readJson } from "./utils.js";

const renderReactFromJSON = (jsonData) => {
  const components = [];
  const imports = new Set();

  const traverseComponent = (componentData, parentPath = []) => {
    let component = "";

    for (const [key, value, path, parent] of traverse(componentData)) {
      if (
        key === "props" ||
        key === "style" ||
        path.includes("style") ||
        path.includes("props")
      ) {
        continue;
      }

      const props = value.props || {};
      const style = value.style || {};

      imports.add(key);

      let currentComponent = `<${key}`;
      if (Object.keys(props).length > 0 || Object.keys(style).length > 0) {
        const propString = Object.entries({ ...props, style })
          .map(([propKey, propValue]) => {
            if (typeof propValue === "object") {
              return `${propKey}={${JSON.stringify(propValue)}}`;
            } else if (typeof propValue === "boolean") {
              return `${propKey}`;
            } else if (typeof propValue === "number") {
              return `${propKey}={${propValue}}`;
            } else {
              return `${propKey}=${JSON.stringify(propValue)}`;
            }
          })
          .join(" ");
        currentComponent += ` ${propString}`;
      }
      currentComponent += `>`;

      if (path.length > parentPath.length) {
        currentComponent += traverseComponent(value, path);
      }

      currentComponent += `</${key}>`;

      if (parent && parent.key === "Page") {
        component += currentComponent;
      } else {
        components.push(component);
      }

      return currentComponent;
    }
  };

  const trav = traverseComponent(jsonData?.App);

  const importStatements = Array.from(imports)
    .map(
      (component) => `import ${component} from '../components/${component}';`
    )
    .join("\n");

  const output = `
import React from 'react';
${importStatements}

const Home = () => {
  return (
    <>
      ${trav}
    </>
  )
};

export default Home;
  `.trim();
  return output;
};

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method == "GET") {
    fs.readFile("index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (req.url === "/o" && req.method === "GET") {
    // res.writeHead(200, { "Content-Type": "application/json" });
    // const jsonData = readJson();
    // res.end(JSON.stringify(jsonData));
    const react = renderReactFromJSON(readJson("sdata.json"));
    // Write to file system
    fs.writeFileSync("app/pages/index.js", react);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(react);
  } else if (req.url === "/" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const jsonData = JSON.parse(body);
        // Process the JSON data as needed
        // ...
        const key = jsonData.key;

        if (!jsonData.key || jsonData.key.length <= 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON data" }));
          return;
        }

        if (!jsonData.message || jsonData.message.length <= 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON data" }));
          return;
        }

        const oldJson = readJson("sdata.json");
        if (key === "title") {
          oldJson.App.Page.props.title = jsonData.message;
        } else if (key === "bg") {
          oldJson.App.Page.style.backgroundColor = jsonData.message;
        }
        fs.writeFileSync("sdata.json", JSON.stringify(oldJson, null, 2));

        const react = renderReactFromJSON(readJson("sdata.json"));
        fs.writeFileSync("app/pages/index.js", react);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: "JSON data received and processed" })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(3001, () => {
  console.log("Server listening on port 3001.");
});

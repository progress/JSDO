# Progress Data Source for Node
This package is a client side TypeScript implementation that extends the JSDO for Node.js web apps. This provides a seamless integration between OpenEdge (Progress Data Object Service) with Node.js web apps.

### Documentation
Progress® Data Objects in an OpenEdge business application can be accessed using the Progress Data Source on the client. For more information, see the <a href="https://docs.progress.com/bundle/data-object-guide/page/Overview-of-Progress-Data-Objects-Services-and-Catalogs.html">Progress Data Objects Guide and Reference.</a>

The Data Source can be used by apps built as Node.js web apps.

### Usage

This is an npm package. This means that node and npm need to be installed to use it.

To use the JSDO, you normally will simply install it from the public NPM registry via an `npm install`. You'll need to select a JSDO package depending on your environment:

```
# For vanilla JS, e.g. running it in a browser:
npm install @progress/jsdo-core

# For usage with node:
npm install @progress/jsdo-node

# For usage with Angular:
npm install @progress/jsdo-angular

# For usage with Nativescript:
npm install @progress/jsdo-nativescript
```

If you want to add changes and build packages yourself from this repository, you will need to use the scripts in `package.json`. The package.json in this folder corresponds to the `@progress/jsdo-node` package.

Here is a quick overview of the npm scripts:

`npm install`

> This installs the necessary dependencies that this package has and needs to be run at least once. 

`npm run build:ds`

> This creates a `build` folder and produces in it a `progress.data.node.js` file that can be used either via including it in a `<script>` tag in an HTML file or via a `DataSource = require('/path/to/build/progress.data.node.js').DataSource;` in your Node app.
> In order to run this, you will need to run `npm install; npm run build:ds` from the packages/ng-datasource folder. This is a temporary measure. 

`npm run test`

> This runs the `build:ds` script and then runs the Mocha tests found in the `test` folder. This can also be run manually by installing Mocha on your environment and then running `mocha --recursive` in the node folder. 

`npm run lint`

> This runs a linter on the DataSource source files.

### License
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

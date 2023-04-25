# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 1.0.0 (2023-04-25)


### ⚠ BREAKING CHANGES

* The request './components' failed to resolve only because it was resolved as fully specified
(probably because the origin is strict EcmaScript Module, e. g. a module with javascript mimetype, a '*.mjs' file, or a '*.js' file where the package.json contains '"type": "module"').
The extension in the request is mandatory for it to be fully specified.
Add the extension to the request.

### Features

* **`monorepo`:** add lerna to manage different dists (react-native support coming soon) ([be81443](https://github.com/joaorr3/react-slip-and-slide/commit/be8144328dfd448a7f6a4e44e63630fc9fa8d6f7))
* **`performance`:** improve performance on native ([284f854](https://github.com/joaorr3/react-slip-and-slide/commit/284f85483411d13126e66ae3368725ce152940d5))
* **`utils`:** improve folder structure + code splitting ([58330fd](https://github.com/joaorr3/react-slip-and-slide/commit/58330fd0b94a162ae33d772909c3ebb3dc6af9c1))
* **`web`, `native`:** add rubberband effect + lazyloading ([13f3c0d](https://github.com/joaorr3/react-slip-and-slide/commit/13f3c0dd40d866801f10f6081d58120b16530008))
* **`web`:** Check edges if window is resized and check if wrapperWidth is smaller than the container. This allow onEdges callback to fire with meaningful flags when the sum of all the items is smaller than the parent container. ([a7537d7](https://github.com/joaorr3/react-slip-and-slide/commit/a7537d79e4d7951eaa93f32e9269403505a0444a))


### Bug Fixes

* **`package`:** lock packages version ([262c60b](https://github.com/joaorr3/react-slip-and-slide/commit/262c60b04d077a71c4f2c2b3e6ec92874fb43cef))
* **`publish`:** packages should't have preconstruct dev script ([69a4c67](https://github.com/joaorr3/react-slip-and-slide/commit/69a4c677a4ae4cf298125009b30b58595225b23e))


* Update package.json from utils package ([66f873c](https://github.com/joaorr3/react-slip-and-slide/commit/66f873c31b700b12fdaa324db79b1ac5868eea7d))

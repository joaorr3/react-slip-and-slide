# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 0.1.0 (2023-04-25)


### Features

* **`monorepo`:** add lerna to manage different dists (react-native support coming soon) ([be81443](https://github.com/joaorr3/react-slip-and-slide/commit/be8144328dfd448a7f6a4e44e63630fc9fa8d6f7))
* **`performance`:** improve performance on native ([284f854](https://github.com/joaorr3/react-slip-and-slide/commit/284f85483411d13126e66ae3368725ce152940d5))
* **`web`, `native`:** add rubberband effect + lazyloading ([13f3c0d](https://github.com/joaorr3/react-slip-and-slide/commit/13f3c0dd40d866801f10f6081d58120b16530008))
* **`web`:** added fullWidthItem prop ([3fcfc0b](https://github.com/joaorr3/react-slip-and-slide/commit/3fcfc0b5cd3bd3b54b3c9004a67892eeea26c4a5))
* **`web`:** allow vertical scroll on web mobile ([ac74992](https://github.com/joaorr3/react-slip-and-slide/commit/ac74992d281a309f9c767b643fbcc371e1ad9505))
* **`web`:** Check edges if window is resized and check if wrapperWidth is smaller than the container. This allow onEdges callback to fire with meaningful flags when the sum of all the items is smaller than the parent container. ([a7537d7](https://github.com/joaorr3/react-slip-and-slide/commit/a7537d79e4d7951eaa93f32e9269403505a0444a))
* **`web`:** minor improvements ([b8977fc](https://github.com/joaorr3/react-slip-and-slide/commit/b8977fc754f98f3eb4b6cb5b5ffd6ed1033cbe06))


### Bug Fixes

* **`ItemComponent`:** add renderItem to deps array ([d8944d7](https://github.com/joaorr3/react-slip-and-slide/commit/d8944d7fdaaf0f65b37ce6ea695d2a9c26b0897d))
* **`package`:** lock packages version ([262c60b](https://github.com/joaorr3/react-slip-and-slide/commit/262c60b04d077a71c4f2c2b3e6ec92874fb43cef))
* **`publish`:** packages should't have preconstruct dev script ([69a4c67](https://github.com/joaorr3/react-slip-and-slide/commit/69a4c677a4ae4cf298125009b30b58595225b23e))
* **`web`, `native`:** allow AnimatedBox to grow to the size of Styled.Item ([3dd4629](https://github.com/joaorr3/react-slip-and-slide/commit/3dd462983b0a7792464ff67774b9586d47c534b1))
* **`web`, `native`:** clampOffset.MAX gets a wrong value if wrapperWidth < container.width which cause the rubberband effect to have a weird behavior + add shouldAnimatedStartup validation. ([f1a8020](https://github.com/joaorr3/react-slip-and-slide/commit/f1a80206ab9f9c4e774ce394cdabac47364d2154))
* **`web`, `native`:** put key in LazyLoad component ([b13d724](https://github.com/joaorr3/react-slip-and-slide/commit/b13d72431c97d63674ba88df7089d802914e6b03))
* **`web`, `native`:** react-native likes width/height: 100% more, instead of flex: 1 ([633b118](https://github.com/joaorr3/react-slip-and-slide/commit/633b11871fec0029cb43bc1bf4f836ee30b49329))
* **`web`:** fix onChange(NaN) bug when fullWidthItem is true and a containerWidth is being defined by the parent ([b147318](https://github.com/joaorr3/react-slip-and-slide/commit/b1473185658b0845d6b0f59433bb87a2f4a479db))

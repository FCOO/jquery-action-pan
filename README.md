# jquery-action-pan
>


## Description
Create pan events on elements with threshold for how long to pan before action is fired

## Installation
### bower
`bower install https://github.com/FCOO/jquery-action-pan.git --save`

## Demo
http://FCOO.github.io/jquery-action-pan/demo/ 

## Usage
    $(selector).actionPan({
        direction: 'down',
        threshold: .35,
        action: function( $elem, options ){...}
    });
    //Will call action-function when the element is panned down 35% of it height


### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `direction` | `string` | `"down"` | `"down"`, `"up"`, `"left"`, or `"right"` |
| `enabled` | `boolean` | `true` | |
| `cssPrefix` | `string` | `"margin-"` | Prefix for the css-property used to move the element |
| `cssPostfix` | `number` | `""` (auto) | `"left"`, `"right"`, `"top"`, or `"bottom"`  |
| `cssFactor` | `number` | `0 (auto) | +1, -1  |
| `threshold` | `number` | `.5 | number <= 1 (`.3`), number (`200`), string (`"200px"`): delta-value for css-property where action is fired  |
| `max` | `number` | `1` | number <= 1 (`.3`), number (`200`), string (`"200px"`): max-value for css-property |
| `maxBeforeAction` | `boolean` | `true` | Animate to max-value before calling action
| `resetAfterAction` | `boolean` | `true` | Reset to start-value after action. NOTE: If `resetAfterAction: false `the element get disabled and can only be panned after `.actionPanEnable( direction )` is called |
| `classNamePan` | `string` | `""` | Class added to the element when it is panning |
| `classNameThreshold` | `string` | `""` | Class added to the element when it is panning AND value is above the threshold value |
| `action` | `function($elem, options)` | `function(){}` | |
### Methods

    $.fn.actionPan(options)                //Add action-pan
    $.fn.actionPanEnable(direction)        //Enable action-pan
    $.fn.actionPanDisable(direction)       //Disable action-pan
    $.fn.actionPanToggle(direction, state) //Switch enable/disable
    $.fn.actionPanReset(direction)         //Reset/move the element back to original position. 
                                           //Usefull if options.resetAfterAction == false


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-action-pan/LICENSE).

Copyright (c) 2017 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk

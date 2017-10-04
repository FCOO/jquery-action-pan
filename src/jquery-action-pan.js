/****************************************************************************
	jquery-action-pan.js, 

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-action-pan
	https://github.com/FCOO

****************************************************************************/

(function ($, window, document, undefined) {
	"use strict";
	

    $.fn.actionPan = function(options) {
        options = $.extend( true, {}, $.fn.actionPan.defaults, options );
        return this.each(function() {
            $(this)._paAdd( options );
        });
    };

    $.fn.actionPanEnable = function(direction) {
        this._panaction_setOptions( direction, {enabled: true} );
    };
    
    $.fn.actionPanDisable = function(direction) {
        this._panaction_setOptions( direction, {enabled: false} );
    };

    $.fn.actionPanToggle = function(direction, state) {
        if (typeof state !== "boolean")
            state = !this._panaction_getOptions( direction ).enabled;
        this._panaction_setOptions( direction, {enabled: state} );
    };

    $.fn.actionPanReset = function(direction) {
        this._panaction_reset( direction, true );
    };
    
    // Plugin defaults – added as a property on our plugin function.
    $.fn.actionPan.defaults = {
        direction   : "down",       //'down', 'up', 'left' or 'right'
        enabled     : true,         
        cssPrefix   : 'margin-',    
        cssPostfix  : '',           //'' (auto), 'left', 'right', 'top', 'bottom'
        cssFactor   : 0,            //0 (auto), +1, -1
        threshold   : .5,           //number <= 1 (0.3), number (200), string ("200px"): delta-value for css-property where action is fired
        max         : 1,            //number <= 1 (0.3), number (200), string ("200px"): max-value for css-property

        maxBeforeAction : true,     //Animate to max-value before calling action
        resetAfterAction: true,     //Reset to start-value after action. NOTE: If resetAfterAction: false the element get disabled and can olny be panned after .actionPanEnable( direction ) is called

        classNamePan        : '',   //Class added to the element when it is panning
        classNameThreshold  : '',   //Class added to the element when it is panning AND value is above thresholdValue
        
        action: function(){}
    };

    var animateOptions = {   
            duration: 'fast', 
            easing  : 'swing',
            queue   : false
        },
    
        directionDefault = {
            down : {cssPostfix: 'top',  cssFactor: +1, hammerDirection: Hammer.DIRECTION_DOWN,  oppositeDirection: 'up',    },
            up   : {cssPostfix: 'top',  cssFactor: -1, hammerDirection: Hammer.DIRECTION_UP,    oppositeDirection: 'down',  },
            left : {cssPostfix: 'left', cssFactor: -1, hammerDirection: Hammer.DIRECTION_LEFT,  oppositeDirection: 'right', horizontal: true },
            right: {cssPostfix: 'left', cssFactor: +1, hammerDirection: Hammer.DIRECTION_RIGHT, oppositeDirection: 'left',  horizontal: true },
    }


    $.fn._paAdd = function( options ){
        var $this = $(this),
            def = directionDefault[options.direction];
        options.cssPostfix = options.cssPostfix || def.cssPostfix;
        options.cssFactor = options.cssFactor || def.cssFactor;
        options.hammerDirection = def.hammerDirection;
        options.oppositeDirection = def.oppositeDirection;
    
        //Calc the max and threshold for when the options.action is fired
        var dim = def.cssPostfix == 'top' ? $this.outerHeight() : $this.outerWidth();
        try { options.threshold = parseFloat(options.threshold); }
        catch (e) { options.threshold = .5; }
        try { options.max = parseFloat(options.max); }
        catch (e) { options.max = 1; }

        if (options.threshold <= 1)
            options.thresholdValue = options.threshold * dim;
        else
            options.thresholdValue = options.threshold;

        if (options.max <= 1)
            options.maxValue = options.max * dim;
        else
            options.maxValue = options.max;

        //Create a string with all className (if any)
        options.classNameAll = '';
        $.each(['classNamePan', 'classNameThreshold'], function( index, classNameId ){
            var className = options[classNameId];
            if (className)
            options.classNameAll = options.classNameAll + (options.classNameAll ? ' ' : '') + className;                  
        });

        //Find the css-property to alter when panning
        options.cssId = options.cssPrefix + options.cssPostfix;

        //Only one direction pro element
        if ( !$this._panaction_getOptions(options.direction) ) {

            //Mark if there are a pan in the opposite direction
            if ($this._panaction_getOptions(options.oppositeDirection)){
                $this._panaction_setOptions(options.direction, {bothDirections: true});
                $this._panaction_setOptions(options.oppositeDirection, {bothDirections: true});
            }

            $this._panaction_setOptions(options.direction, options);
            $this.on('pan'+options.direction+'.panaction pan'+options.oppositeDirection+'.panaction', pan);
            if (!$this.data('panstart_and_panend-added')){
                $this.on('panstart.panaction', panstart);
                $this.on('panend.panaction',   panend);
                $this.data('panstart_and_panend-added', true);
            }
        }
    }

    $.fn._panaction_getOptions = function( direction ){
        return this.data( 'paOptions-'+direction );
    }

    $.fn._panaction_setOptions = function( direction, options ){
        var originalOptions = this._panaction_getOptions( direction );
        this.data( 'paOptions-'+direction, $.extend({}, originalOptions, options) );
        return this;
    }


    $.fn._panaction_reset = function( direction, forceBack ){
        var $this = $(this),
            properties = {};

        $.each(direction ? [direction] : ['down', 'up', 'left', 'right'], function(index, direction ){
            var options = $this._panaction_getOptions( direction );
            if (options){
                if (options.enabled && (!options.aboveThreshold || options.resetAfterAction || forceBack))
                    //pan back to original state
                    properties[options.cssId] = options.startValue;

                //Remove all pan-classes
                $this.removeClass( options.classNameAll );
            }
        });
        $this.animate( properties, animateOptions );
    }    
    
    function panstart( event ){
        var $this = $(this);

        $this.data('panaction_panstart_called', true);

        $.each(['down', 'up', 'left', 'right'], function(index, direction ){
            var options = $this._panaction_getOptions( direction );                
            if (options && options.enabled){
                var startValue = parseFloat( $this.css(options.cssId) );

                //Calc total and threshold range
                var range, thresholdRange;
                if (options.cssFactor > 0){
                    range = {
                        min: startValue,
                        max: startValue + options.maxValue
                    };
                    thresholdRange = {
                        min: startValue + options.thresholdValue,
                        max: range.max
                    }
                }
                else {
                    range = {
                        min: startValue - options.maxValue,
                        max: startValue
                    };
                    thresholdRange = {
                        min: range.min,
                        max: startValue - options.thresholdValue
                    }
                }
    
                $this.addClass( options.classNamePan );
                $this._panaction_setOptions( direction, {
                    startValue      : startValue,
                    value           : startValue,
                    range           : range,
                    thresholdRange  : thresholdRange,
                    aboveThreshold  : false
                });
            }
        });
    }


    function pan( event ){
        var $this = $(this);
        //Due to a bug in Hammer.js panstart isn't allways called if the previous pan was stop by 'force' 
        if (!$this.data('panaction_panstart_called'))
            $this.trigger( 'panstart.panaction' );    

        $.each(['down', 'up', 'left', 'right'], function(index, direction ){
            var options = $this._panaction_getOptions( direction );
            if (options && options.enabled){
                //Get the value of the css-property to use when panning
                var deltaValue = options.hammerDirection & Hammer.DIRECTION_HORIZONTAL ? event.gesture.deltaX : event.gesture.deltaY,
                    thresholdValue  = options.thresholdValue,
                    newValue        = options.startValue + deltaValue,
                    range           = options.range;

                //Adjust range if opposite pan exists and is enabled
                var oppositeOptions = $this._panaction_getOptions( directionDefault[direction].oppositeDirection );
                if (oppositeOptions && oppositeOptions.enabled){
                    range.min = Math.min( range.min, oppositeOptions.range.min );
                    range.max = Math.max( range.max, oppositeOptions.range.max );
                }
                newValue = Math.max( newValue, range.min );
                newValue = Math.min( newValue, range.max );


                $this._panaction_setOptions( direction, { value: newValue });
                $this.css( options.cssId, newValue );

                //Check if value is above thresholdValue
                var aboveThreshold = ((newValue >= options.thresholdRange.min) && (newValue <= options.thresholdRange.max)),
                    atMax = ((options.cssFactor > 0) && (newValue == options.range.max)) || ((options.cssFactor < 0) && (newValue == options.range.min));

                $this.toggleClass( options.classNameThreshold, !!aboveThreshold );

                $this._panaction_setOptions( direction, { 
                    atMax         : atMax,
                    aboveThreshold: aboveThreshold 
                });
            }
        });
        return false;        
    }

    function panend( event ){ 
        var $this = $(this),
            actionFound = false;
        $.each(['up', 'down', 'left', 'right'], function(index, direction ){
            var options = $this._panaction_getOptions( direction );
            if (options && options.enabled){
               
                //Check if the value is above the threshold
                if (options.aboveThreshold){
                    var actionAndReset = function(){ 
//                        options.action( $this, options );
                        $this._panaction_reset( direction );
                        
                        //Disable if not resetting
                        if (!options.resetAfterAction)
                            $this.actionPanDisable( direction );

                        options.action( $this, options );
                    };
                    //Animate to max if not at max and need to
                    if (options.maxBeforeAction && !options.atMax){
                        actionFound = true;
                        //Animate to max and the fire action
                        var properties = {};
                        properties[options.cssId] = options.cssFactor > 0 ? options.range.max : options.range.min;

                        $this.animate( properties, $.extend({}, animateOptions, {always: actionAndReset}) );
                    }
                    else
                        //Just fire action
                        actionAndReset();
                    return false;
                }
                else
                    //Reset the 'direction' if it is panned
                    if ((options.value > options.range.min) && (options.value < options.range.max))
                        $this._panaction_reset( direction );
            }
        });
    }        
}(jQuery, this, document));
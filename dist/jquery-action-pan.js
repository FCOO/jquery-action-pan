/****************************************************************************
	jquery-action-pan.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-action-pan
	https://github.com/FCOO

****************************************************************************/

(function ($/*, window, document, undefined*/) {
	"use strict";

    //click-event to (try to) take care of ghost click
    var actionPanIsPanningId = 'actionPan_is_panning_id';

    $.fn.actionPan = function(options) {
        options = $.extend( true, {}, $.fn.actionPan.defaults, options );
        return this.each(function() {
            $(this)._panaction_add( options );
        });
    };

    $.fn.actionPanEnable = function(direction) {
        return this._panaction_setOptions( direction, {enabled: true} );
    };

    $.fn.actionPanDisable = function(direction) {
        return this._panaction_setOptions( direction, {enabled: false} );
    };

    $.fn.actionPanToggle = function(direction, state) {
        if (typeof state !== "boolean")
            state = !this._panaction_getOptions( direction ).enabled;
        return this._panaction_setOptions( direction, {enabled: state} );
    };

    $.fn.actionPanIsPanning = function(){
        return !!this.data(actionPanIsPanningId);
    };

    $.fn.actionPanReset = function(direction, checkForPan) {
        if (!checkForPan || !this.actionPanIsPanning())
            this._panaction_reset( direction, true );
        return this;
    };

    $.fn.actionPanForce = function(direction, checkForPan){
        if (!checkForPan || !this.actionPanIsPanning()){
            this._panaction_panstart();
            this._panaction_panend( null, direction );
        }
        return this;
    };


    // Plugin defaults � added as a property on our plugin function.
    $.fn.actionPan.defaults = {
        direction   : "down",       //'down', 'up', 'left' or 'right'
        enabled     : true,
        cssPrefix   : 'margin-',
        cssPostfix  : '',           //'' (auto), 'left', 'right', 'top', 'bottom'
        cssFactor   : 0,            //0 (auto), +1, -1
        threshold   : .5,           //number <= 1 (0.3), number (200), string ("200px"), or function($element) return number: delta-value for css-property where action is fired
        max         : 1,            //number <= 1 (0.3), number (200), string ("200px"), or function($element) return number: max-value for css-property

        maxBeforeAction : true,     //Animate to max-value before calling action
        resetAfterAction: true,     //Reset to start-value after action. NOTE: If resetAfterAction: false the element get disabled and can olny be panned after .actionPanEnable( direction ) is called

        classNamePan        : '',   //Class added to the element when it is panning
        classNameThreshold  : '',   //Class added to the element when it is panning AND value is above thresholdValue

        shadows             : null, //jQuery-selection of element that gets same panning as the element
        onPan               : null, //function( $element, direction, delta, options, event ): called when the element is panned
        action              : function(){}
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
    };


    //****************************************************
    //_panaction_add( options )
    //****************************************************
    $.fn._panaction_add = function( options ){

        //Prevent ghost click
        this.on('click', function( event ){
            if ( $(this).actionPanIsPanning() ){
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
        });


        var def = directionDefault[options.direction];
        options.cssPostfix        = options.cssPostfix || def.cssPostfix;
        options.cssFactor         = options.cssFactor || def.cssFactor;
        options.hammerDirection   = def.hammerDirection;
        options.oppositeDirection = def.oppositeDirection;

        //Create a string with all className (if any)
        options.classNameAll = [options.classNamePan || '', options.classNameThreshold || ''].join(' ');

        //Find the css-property to alter when panning
        options.cssId = options.cssPrefix + options.cssPostfix;

        //Only one direction pro element
        if ( !this._panaction_getOptions(options.direction) ) {

            //Mark if there are a pan in the opposite direction
            if (this._panaction_getOptions(options.oppositeDirection)){
                this._panaction_setOptions(options.direction, {bothDirections: true});
                this._panaction_setOptions(options.oppositeDirection, {bothDirections: true});
            }

            this._panaction_setOptions(options.direction, options);

            //Add events, but only once pro element
            if (!this.data('panstart_and_panend_added'))
                this
                    .on('pan'+options.direction+'.panaction pan'+options.oppositeDirection+'.panaction', $.proxy(this._panaction_pan, this))
                    .on('panstart.panaction', $.proxy(this._panaction_panstart, this))
                    .on('panend.panaction',   $.proxy(this._panaction_panend, this))
                    .data('panstart_and_panend_added', true);
        }
        return this;
    };

    $.fn._panaction_getOptions = function( direction ){
        return this.data( 'paOptions-'+direction );
    };

    $.fn._panaction_setOptions = function( direction, options ){
        var originalOptions = this._panaction_getOptions( direction );
        this.data( 'paOptions-'+direction, $.extend({}, originalOptions, options) );
        return this;
    };


    //****************************************************
    //_panaction_reset( direction, forceBack )
    //****************************************************
    $.fn._panaction_reset = function( direction, forceBack ){
        var properties = {},
            options = this._panaction_getOptions( direction );

        if (options){
            if (forceBack || (options.enabled && (!options.aboveThreshold || options.resetAfterAction))){
                //pan back to original state
                properties[options.cssId] = options.startValue;

                //Pan back the shadow
                if (options.shadows)
                    options.shadows.each(function(){
                        var $shadow = $(this),
                            shadowProerties = {};
                        shadowProerties[options.cssId] = $shadow._panaction_getOptions( direction ).startValue;
                        $shadow.animate( shadowProerties, animateOptions );
                    });
            }

            //Remove all pan-classes
            this.removeClass( options.classNameAll );
            this.animate( properties, animateOptions );
        }
        return this;
    };

    //****************************************************
    //_panaction_panstart( event )
    //****************************************************
    $.fn._panaction_panstart = function( /*event*/ ){
        var $this = this, options;

        $this.data(actionPanIsPanningId, true);

        //******************************************
        function getValue(value, defaultValue, elemDim){
            var result = $.isFunction(value) ? value($this, options) : value;
            try {
                result = parseFloat(result);
            }
            catch (e) {
                result = defaultValue;
            }
            if (result <= 1)
                result = result*elemDim;
            return result;
        }
        //******************************************

        $this.data('panaction_panstart_called', true);

        $.each(['down', 'up', 'left', 'right'], function( index, direction ){
            options = $this._panaction_getOptions( direction );

            if (options && options.enabled){
                //Calc the max and threshold for when the options.action is fired
                var startValue     = parseFloat( $this.css(options.cssId) ),
                    $elemToUse     = options.panOwner ? options.panOwner : $this,
                    elemDim        = directionDefault[direction].horizontal ? $elemToUse.outerWidth() : $elemToUse.outerHeight(),
                    thresholdValue = getValue(options.threshold, $.fn.actionPan.defaults.threshold, elemDim),
                    maxValue       = getValue(options.max, $.fn.actionPan.defaults.max, elemDim);

                //Calc total and threshold range
                var range, thresholdRange;
                if (options.cssFactor > 0){
                    range = {
                        min: startValue,
                        max: startValue + maxValue
                    };
                    thresholdRange = {
                        min: startValue + thresholdValue,
                        max: range.max
                    };
                }
                else {
                    range = {
                        min: startValue - maxValue,
                        max: startValue
                    };
                    thresholdRange = {
                        min: range.min,
                        max: startValue - thresholdValue
                    };
                }

                $this.addClass( options.classNamePan );
                $this._panaction_setOptions( direction, {
                    startValue    : startValue,
                    value         : startValue,
                    thresholdValue: thresholdValue,
                    maxValue      : maxValue,
                    range         : range,
                    thresholdRange: thresholdRange,
                    aboveThreshold: false
                });

                if (options.shadows)
                    options.shadows.each(function(){
                        var $this = $(this);
                        $this._panaction_setOptions( direction, { startValue: parseFloat( $this.css(options.cssId) ) } );
                    });
            }
        });
        return this;
    };

    //****************************************************
    //_panaction_pan( event )
    //****************************************************
    $.fn._panaction_pan = function( event ){
        var $this = this;

        //Due to a bug in Hammer.js panstart isn't allways called if the previous pan was stop by 'force'
        if (!$this.data('panaction_panstart_called'))
            $this.trigger( 'panstart.panaction' );

        $.each(['down', 'up', 'left', 'right'], function(index, direction ){
            var options = $this._panaction_getOptions( direction );


            if (options && options.enabled){
                //Get the value of the css-property to use when panning
                var deltaValue = options.hammerDirection & Hammer.DIRECTION_HORIZONTAL ? event.gesture.deltaX : event.gesture.deltaY,
                    newValue   = options.startValue + deltaValue,
                    range      = options.range;

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

                //Update deltaValue to 'real' value
                deltaValue = newValue - options.startValue;

                //Check if value is above thresholdValue
                var aboveThreshold = ((newValue >= options.thresholdRange.min) && (newValue <= options.thresholdRange.max)),
                    atMax = ((options.cssFactor > 0) && (newValue == options.range.max)) || ((options.cssFactor < 0) && (newValue == options.range.min));

                $this.toggleClass( options.classNameThreshold, !!aboveThreshold );

                $this._panaction_setOptions( direction, {
                    atMax         : atMax,
                    aboveThreshold: aboveThreshold
                });

                //Call onPan (if any)
                if (options.onPan)
                    options.onPan( $this, direction, newValue - options.startValue, options, event );

                //Update all shadows (if any)
                if (options.shadows)
                    options.shadows.each(function(){
                        var $shadow = $(this);
                        $shadow.css(
                            options.cssId,
                            $shadow._panaction_getOptions( direction ).startValue + deltaValue
                        );
                    });
            } //end of if (options && options.enabled){
        });
        return this;
    };

    //****************************************************
    //_panaction_panend( event, forceDirection )
    //****************************************************
    $.fn._panaction_panend = function( event, forceDirection ){
        var $this = this,
            actionFound = false;

        $.each(['up', 'down', 'left', 'right'], function( index, direction ){
            var options = $this._panaction_getOptions( direction );
            if (options && options.enabled){

                //Create function to reset and call action
                var actionAndReset = function (){
                    $this._panaction_reset( direction );

                    if (options.action)
                        options.action( $this, options );
                };

                //If a forceDirection is given: Use only this direction
                if (forceDirection){
                    if (direction == forceDirection){
                        actionFound            = false;
                        options.aboveThreshold = true;
                        options.atMax          = false;

                    }
                    else
                        actionFound = true;
                }

                if ( actionFound || (forceDirection && (direction != forceDirection)) ){
                    //Remove all pan-classes
                    $this.removeClass( options.classNameAll );
                    return true;
                }

                //Check if the value is above the threshold
                if (options.aboveThreshold || (direction == forceDirection)){
                    //Animate to max if not at max and need to
                    if (options.maxBeforeAction && !options.atMax){
                        //Animate to max and the fire action
                        var properties = {},
                            newValue   = options.cssFactor > 0 ? options.range.max : options.range.min,
                            deltaValue = newValue - options.startValue;
                        properties[options.cssId] = newValue;
                        $this.animate( properties, $.extend({}, animateOptions, {always: actionAndReset}) );

                        if (options.shadows)
                            options.shadows.each(function(){
                                var $shadow = $(this),
                                    shadowProerties = {};
                                shadowProerties[options.cssId] = $shadow._panaction_getOptions( direction ).startValue + deltaValue;
                                $shadow.animate( shadowProerties, animateOptions );
                            });

                    }
                    else
                        //Just fire action
                        actionAndReset();

                    actionFound = true;
                }
                else
                    //Reset the 'direction' if it is panned
                    if ((options.value > options.range.min) && (options.value < options.range.max))
                        $this._panaction_reset( direction );
            }
        });
        window.setTimeout(function(){
            $this.data(actionPanIsPanningId, false);
        }, 200);
        return this;
    };

}(jQuery, this, document));
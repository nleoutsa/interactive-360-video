
/*
********************************************************
    API
********************************************************
*/

function CssSphere (containerId) {
    var self = this;

    var progressElement;

    this.container = document.getElementById(containerId || 'cssSphereContainer');

    this.perspective = (self.sceneHeight / 2) + (self.sceneHeight / 8) + (self.sceneHeight / 32) + (self.sceneHeight / 128);

    function calculatePerspective () {
        // TODO: find more accurate way to calculate perspective;
        self.perspective = (self.sceneHeight / 2) + (self.sceneHeight / 8) + (self.sceneHeight / 32) + (self.sceneHeight / 128);
    }

    this.rotation = function () {
        return self.camera.components.rotation.data;
    };

    /*
    *   generateScene(options, callback)
    *
    *   PARAMS
    *   options: {
    *       src: STRING,
    *       controls: BOOLEAN,
    *       editMode: BOOLEAN
    *   },
    *   callback: FUNCTION
    */
    this.generateScene = function (options, callback) {
        if (!options || typeof options !== 'object') {
            console.warn('Must provide options object.');
            return;
        }

        var ext,
            aCamera,
            sceneBackground,
            aAssets,
            playButton,
            pauseButton,
            videoSource,
            aCursor,
            videoControls;

        this.addedDOMElements = [];
        this.visibleDOMElements = [];

        // Get source extension
        if (options.src && typeof options.src === 'string') {
            ext = options.src.split('.').pop();
        }

        // Establish which mode we are in: "Edit" or "View" - determines whether positioning
        // controls will be created for elements.
        self.editMode = !!options.editMode;

        // Create AFrame scene (sets up THREEjs scene)
        self.aScene = document.createElement('a-scene');

        // Setup DOM style clickable controls
        function createDOMStyleVideoControls () {
            var vidControls = document.createElement('div'),
                progressBar = document.createElement('div'),
                progress = document.createElement('div'),
                time = document.createElement('div');

            vidControls.style.position = 'fixed';
            vidControls.style.right = 0;
            vidControls.style.left = 0;
            vidControls.style.bottom = 0;
            vidControls.style.height = '30px';
            vidControls.style.borderTop = '2px solid #fff';
            vidControls.style.zIndex = 999999999;

            playButton.style.position = 'absolute';
            playButton.style.left = 0;
            playButton.style.width = '20px';
            playButton.style.top = 0;
            playButton.style.bottom = 0;
            playButton.style.padding = '5px';
            playButton.style.borderRight = '2px solid #fff';
            playButton.style.cursor = 'pointer';

            progressBar.style.position = 'absolute';
            progressBar.style.right = 0;
            progressBar.style.left = '32px';
            progressBar.style.top = 0;
            progressBar.style.bottom = 0;
            progressBar.style.cursor = 'pointer';
            progressBar.style.backgroundColor = 'rgba(0,0,0,0.7)';

            progress.style.position = 'absolute';
            progress.style.right = '100%';
            progress.style.left = 0;
            progress.style.top = 0;
            progress.style.bottom = 0;
            progress.style.backgroundColor = '#962312';

            time.style.position = 'absolute';
            time.style.left = '10px';
            time.style.height = '30px';
            time.style.lineHeight = '30px';
            time.style.color = '#fff';
            time.innerHTML = 0.00;
            time.style.userSelect = 'none';

            self.progressElement = progress;
            self.progressTime = time;

            playButton.addEventListener('click', function () {
                if (self.videoElement.currentTime > 0 && !self.videoElement.paused && !self.videoElement.ended) {
                    self.videoElement.pause();
                } else {
                    self.videoElement.play();
                }
                updatePlayButton();
            });

            progressBar.addEventListener('click', function (e) {
                self.videoElement.currentTime = self.videoElement.duration * e.offsetX / this.clientWidth;
            });

            vidControls.appendChild(playButton);
            progressBar.appendChild(progress);
            progressBar.appendChild(time);
            vidControls.appendChild(progressBar);

            return vidControls;
        }

        // If video provided create videosphere
        if ('mp4'.indexOf(ext) > -1 && options.controls) {
            // setup controls and video source stuff
            aAssets = document.createElement('a-assets');

            playButton = document.createElement('img');
            playButton.setAttribute('id', 'video-play-image');
            playButton.setAttribute('src', 'images/play.png');

            pauseButton = document.createElement('img');
            pauseButton.setAttribute('id', 'video-pause-image');
            pauseButton.setAttribute('src', 'images/pause.png');

            // Must create an actual video element for the video controls to
            // get access to video timing info/play-pause controls.
            videoSource = document.createElement('video');
            videoSource.setAttribute('id', 'video_1');
            videoSource.setAttribute('src', options.src);
            self.videoElement = videoSource;

            videoControls = document.createElement('a-entity');
            videoControls.setAttribute('video-controls', 'src:#video_1');

            aAssets.appendChild(playButton);
            aAssets.appendChild(pauseButton);
            aAssets.appendChild(videoSource);

            if (options.controlsType === 'aframe') {
                // Cursor allows us to interact with aframe entity controls
                aCursor = document.createElement('a-cursor');
                aCursor.setAttribute('id', 'cursor');
                aCursor.setAttribute('material', 'color: cyan;');

                videoControls.setAttribute('position', '0 0 -2');
            }

            self.aScene.appendChild(videoControls);

            if (options.controlsType !== 'aframe') {
                self.container.appendChild(createDOMStyleVideoControls());
                window.addEventListener('keyup', function(event) {
                    switch (event.keyCode) {
                        // If space bar is pressed, fire click on playButton
                        case 32:
                            updatePlayButton();
                            break;
                    }
                }, false);
            }

            self.aScene.appendChild(aAssets);

            sceneBackground = document.createElement('a-videosphere');
            sceneBackground.setAttribute('src', '#video_1');
        } else if (['mp4', 'jpg', 'jpeg', 'png', 'svg', 'gif', 'tiff'].indexOf(ext) > -1) {
            // If options.controls is NOT TRUE, but the src is still an mp4, simply treat it like an image.
            // This will take care of autoplaying it and limit the number of created elements.
            sceneBackground = document.createElement('a-sky');
            sceneBackground.setAttribute('src', options.src);
        } else {
            // Otherwise, user can enter a color
            sceneBackground = document.createElement('a-sky');
            sceneBackground.setAttribute('color', options.src || "#fff");
        }

        // Create Camera for AFrame scene (this is necessary in order to give camera an id)
        aCamera = document.createElement('a-entity');
        aCamera.setAttribute('camera', '');
        aCamera.setAttribute('look-controls', '');

        self.camera = aCamera;

        if (aCursor) {
            aCamera.appendChild(aCursor);
        }

        self.aScene.appendChild(aCamera);
        self.aScene.appendChild(sceneBackground);

        // Create cssSphere div. This will hold all DOM elements in the 3d sphere
        self.sphere = document.createElement('div');
        self.sphere.setAttribute('id', 'cssSphere');

        // Add scene and sphere to DOM
        self.container.appendChild(self.aScene);
        self.container.appendChild(self.sphere);

        // Set perspective: this must be accurate to maintain positioning as video warps.
        self.sphere.style.transform = 'perspective(' + self.perspective + 'px) translateX(0) translateY(0) translateZ(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';

        // called to add DOM elements of a specific class to the scene. IN PROGRESS
        // self.addDOMElementsFromClass();

        window.onload = function () {
            self.sceneHeight = self.aScene.canvas.clientHeight;
            calculatePerspective();
            progressElement = self.progressElement;

            self.updateSphere(0);
        };

        window.onresize = function () {
            calculatePerspective();
        };

        // fire callback if one is provided
        if (callback) {
            if (typeof callback !== 'function') {
                console.warn('typeof callback parameter [' + callback + '] is [' + (typeof callback) + ']. It should be a function.');
                return;
            }
            callback();
        }
    };

    // Keep playButton state
    function updatePlayButton () {
        requestAnimationFrame(function () {
            var playButton = document.getElementById('video-play-image');

            if (self.videoElement.currentTime > 0 && !self.videoElement.paused && !self.videoElement.ended) {
                playButton.setAttribute('src', 'images/pause.png');
            } else {
                playButton.setAttribute('src', 'images/play.png');
            }
        });
    }

    // Jump to video time in seconds.
    this.seekToTime = function (seconds) {
        self.videoElement.currentTime = seconds;
        self.videoElement.play();
        updatePlayButton();
    };

    this.addDOMElementToScene = function (options) {
        // Get the DOM element
        var dom_element = document.getElementById(options.id);

        // Create a css_sphere_dom_element from the original.
        var css_sphere_dom_element = new CssSphereDOMElement(dom_element);

        // Set options on the element object.
        css_sphere_dom_element.options = options;

        // Keep track of all 360 elements in scene.
        self.addedDOMElements.push(css_sphere_dom_element);

        // Element is not visible until it is told to be.
        css_sphere_dom_element.currentlyVisible = false;
    };

    /*
    *   Add all elements from a certain class. Incomplete. How will these be positioned?
    */
    // this.addDOMElementsFromClass = function (classname) {
    //     var dom_elements = document.getElementsByClassName(classname);
    //
    //     var i,
    //         css_sphere_dom_element;
    //
    //     for (i = 0; i < dom_elements.length; i++) {
    //         css_sphere_dom_element = new CssSphereDOMElement(dom_elements[i]);
    //         self.addElementToScene(css_sphere_dom_element);
    //     }
    // };

    this.addElementToScene = function (css_sphere_dom_element, transformArray) {
        css_sphere_dom_element.parentSphere = self;
        if (self.editMode) {
            css_sphere_dom_element.setupControllers();
        }
        css_sphere_dom_element.setPositionFromArray(transformArray || [0,0,0,0,0,0,0,0,0,0,0,0]);
        css_sphere_dom_element.currentlyVisible = true;
        self.sphere.appendChild(css_sphere_dom_element.el());
        self.visibleDOMElements.push(css_sphere_dom_element);
    };

    this.removeElementFromScene = function (css_sphere_dom_element) {
        css_sphere_dom_element.currentlyVisible = false;
        self.sphere.removeChild(css_sphere_dom_element.el());
        self.visibleDOMElements.splice(css_sphere_dom_element, 1);
    };

    this.updateSphere = function (cycle) {
        window.requestAnimationFrame(function () {
            var rotation = self.rotation();
            var duration = self.videoElement.duration;
            var currentTime = self.videoElement.currentTime;

            var activeDOMElement;
            var i;

            // Update CSS Sphere rotation EVERY frame
            self.sphere.style.transform = 'perspective(' + self.perspective + 'px) translateX(0) translateY(0) translateZ(0) rotateX(' + rotation.x + 'deg) rotateY(' + -rotation.y + 'deg)';

            // Update progress bar if present
            if (progressElement) {
                progressElement.style.right = 100 - ((100 * currentTime / duration)) + '%';
                self.progressTime.innerHTML = currentTime.toFixed(2) + ' / ' + duration.toFixed(2);
            }

            // Cycle through ALL DOM elements every X frames
            if (cycle % 20 === 0) {

                // Set visible elements
                for (i = 0; i < self.addedDOMElements.length; i++) {
                    activeDOMElement = self.addedDOMElements[i];

                    if (activeDOMElement.options.start >= currentTime || activeDOMElement.options.end <= currentTime) {
                        // Remove elements which shouldn't be visible.
                        if (activeDOMElement.currentlyVisible === true) {
                            self.removeElementFromScene(activeDOMElement);
                        }
                    } else {
                        // Add element to scene if it isn't already visible.
                        if (activeDOMElement.currentlyVisible === false) {
                            self.addElementToScene(activeDOMElement, activeDOMElement.options.transform);
                        }
                    }
                }
            }

            for (i = 0; i < self.visibleDOMElements.length; i++) {
                activeDOMElement = self.visibleDOMElements[i];

                // Cycle through visible DOM elements every frame:
                if (activeDOMElement.options.animationEnd) {
                    updateAnimation(activeDOMElement, currentTime);
                }
            }

            if (self.editMode) {
                for (i = 0; i < self.visibleDOMElements.length; i++) {
                    activeDOMElement = self.visibleDOMElements[i];

                    // Handle 'global rotation' controllers that are toggled on.
                    if (activeDOMElement.activeGlobalRotationControllers.x) {
                        activeDOMElement.updateGlobalRotation('x', -rotation.x + -activeDOMElement.startingRotation.x);
                    }
                    if (activeDOMElement.activeGlobalRotationControllers.y) {
                        activeDOMElement.updateGlobalRotation('y', rotation.y + activeDOMElement.startingRotation.y);
                    }
                }
            }

            self.updateSphere(cycle + 1);
        });
    };

    function updateAnimation (animatedElement, currentTime) {
        // currently only handles changes to an elements Global Rotation values between two points.
        var startTransform = animatedElement.options.transform;
        var endTransform = animatedElement.options.animationEnd;
        var startTime = animatedElement.options.start;
        var endTime = animatedElement.options.end;

        var animationDuration = endTime - startTime;
        var decimalComplete = (currentTime - startTime) / animationDuration;

        var distanceY = endTransform[1] - startTransform[1];
        var rotationTraveledY = decimalComplete * distanceY;
        animatedElement.updateGlobalRotation('y', startTransform[1] + rotationTraveledY);

        var distanceX = endTransform[0] - startTransform[0];
        var rotationTraveledX = decimalComplete * distanceX;
        animatedElement.updateGlobalRotation('x', startTransform[0] + rotationTraveledX);
    }
}

































































// Provide rotation data for global and local rotation
// Global rotation determines the element's position, measured in degrees from the camera's origin.
// entered as [globalX, globalY, globalZ, localX, localY, localZ]
// Using a right hand rule.
function CssSphereDOMElement (element) {
    var self = this;
    var global_transform_wrapper = document.createElement('div');
    var local_transform_wrapper = document.createElement('div');

    global_transform_wrapper.style.position = 'absolute';
    global_transform_wrapper.style.transformStyle = 'preserve-3d';
    local_transform_wrapper.style.position = 'absolute';
    local_transform_wrapper.style.transformStyle = 'preserve-3d';

    element.style.display = 'block';

    local_transform_wrapper.appendChild(element);
    global_transform_wrapper.appendChild(local_transform_wrapper);

    this.transforms = {};
    this.transforms.global = {};
    this.transforms.local = {};
    this.transforms.global.rotation = {};
    this.transforms.local.translation = {};
    this.transforms.local.rotation = {};
    this.transforms.local.scale = {};

    this.activeGlobalRotationControllers = {};
    this.startingRotation = {};
    this.axes = ['x', 'y', 'z'];
    this.local_transform_controller;

    this.transformHistory = [];
    this.transformHistoryState = 0;

    this.setupControllers = function () {
        var global_transform_controller = new self.GlobalTransformController();

        var controller,
            i;

        for (i = 0; i < 2; i++) {
            controller = new GlobalRotationController(i);
            global_transform_controller.appendChild(controller.el());

            controller = new HistoryController(i);
            global_transform_controller.appendChild(controller.el());
        }

        self.local_transform_controller = new LocalTransformController();
        global_transform_controller.appendChild(self.local_transform_controller.el());

        global_transform_wrapper.appendChild(global_transform_controller);
    };

    this.GlobalTransformController = function () {
        var global_transform_controller = document.createElement('div');
        global_transform_controller.style.borderRadius = '10px';
        global_transform_controller.style.backgroundColor = '#444';

        global_transform_controller.style.transform = 'translateX(-600px) translateY(-1700px) scale(3)';

        return global_transform_controller;
    };

    function applyAxisControllerStyles (element) {
        element.style.textAlign = 'center';
        element.style.userSelect = 'none';
        element.style.cursor = 'pointer';
        element.style.fontSize = '44px';
        element.style.position = 'absolute';
        element.style.transformStyle = 'preserve-3d';
    }

    function GlobalRotationController(i) {
        var axes = self.axes;
        var axis = axes[i];
        var controller = document.createElement('div');

        controller.style.height = '50px';
        controller.style.width = '150px';
        controller.style.borderRadius = '10px';
        controller.innerHTML = (i === 0 ? 'Y' : 'X') + ' Lock';
        controller.style.backgroundColor = '#ddd';
        applyAxisControllerStyles(controller);

        controller.style.transform = 'translateX(25px) translateY(' + (70 * (i + 1)) + 'px)';

        controller.addEventListener('click', function (e) {
            e.preventDefault();
            if (self.activeGlobalRotationControllers[axis]) {
                controller.style.backgroundColor = '#ddd';
                self.activeGlobalRotationControllers[axis] = false;

                addToTransformHistory(self.transforms);
            }
            else {
                controller.style.backgroundColor = '#db6327';
                self.startingRotation.x = -self.transforms.global.rotation.x - self.parentSphere.rotation().x;
                self.startingRotation.y = self.transforms.global.rotation.y - self.parentSphere.rotation().y;
                self.activeGlobalRotationControllers[axis] = true;
            }
        });

        this.el = function () {
            return controller;
        };
    };

    function LocalTransformController () {
        var controller = document.createElement('div');
        var controller_handle;
        var i;

        for (i = 0; i < 3; i++) {
            controller_handle = controllerHandle(i);
            controller_handle.appendChild(controllerKnob(i, 'Rotation'));
            controller_handle.appendChild(controllerKnob(i, 'Translation'));
            controller_handle.appendChild(controllerKnob(i, 'Scale'));

            controller.appendChild(controller_handle);
        }

        applyAxisControllerStyles(controller);

        controller.style.transform = 'translateX(520px) translateY(100px) rotateX(70deg) rotateZ(15deg) rotateY(0deg)';

        this.el = function () {
            return controller;
        };
    };

    function controllerKnob(i, transform_type) {
        var axis = self.axes[i];
        var controller_knob = document.createElement('div');
        var controller_active = false;
        var mouse_start = {};
        var knob_side_width = 30;

        var controller_knob_side;
        var updated_position;
        var j;

        controller_knob.className = transform_type + '-knob three-d ' + axis + '-axis-color';

        if (transform_type === 'Scale' && i !== 2) {
            for (j = 0; j < 6; j++) {
                controller_knob_side = document.createElement('div');
                controller_knob_side.className = transform_type + '-knob-side three-d ' + axis + '-axis-color';

                if (j === 0) {
                    controller_knob_side.style.transform = 'translateZ(-10px)';
                }
                else if (j === 1) {
                    controller_knob_side.style.transform = 'translateY(' + knob_side_width / 2 + 'px) translateZ(4px) rotateX(90deg)';
                }
                else if (j === 2) {
                    controller_knob_side.style.transform = 'translateZ(' + ((knob_side_width / 2) + 4) + 'px)';
                }
                else if (j === 3) {
                    controller_knob_side.style.transform = 'translateY(-' + knob_side_width / 2 + 'px) translateZ(4px) rotateX(90deg)';
                }
                else if (j === 4) {
                    controller_knob_side.style.transform = 'translateX(' + knob_side_width / 2 + 'px) translateZ(4px) rotateY(90deg)';
                }
                else if (j === 5) {
                    controller_knob_side.style.transform = 'translateX(-' + knob_side_width / 2 + 'px) translateZ(4px) rotateY(90deg)';
                }

                controller_knob.appendChild(controller_knob_side);
            }
            document.addEventListener('mousemove', function (e) {
                e.preventDefault();

                if (controller_active) {
                    updated_position = (e['client' + axis.toUpperCase()] - mouse_start[axis]) * (axis === 'y' ? -1 : 1);
                    self['update' + transform_type](axis, updated_position);
                }
            });
        }
        else if (transform_type === 'Translation') {
            for (j = 0; j < 4; j++) {
                controller_knob_side = document.createElement('div');
                controller_knob_side.className = transform_type + '-knob-side three-d ' + axis + '-axis-color';

                if (j === 0) {
                    controller_knob_side.style.transform = 'translateY(8px) rotateX(90deg) rotateY(-18deg)';
                }
                else if (j === 1) {
                    controller_knob_side.style.transform = 'translateY(-8px) rotateX(90deg) rotateY(18deg)';
                }
                else if (j === 2) {
                    controller_knob_side.style.transform = 'translateZ(-8px) rotateY(-18deg)';
                }
                else if (j === 3) {
                    controller_knob_side.style.transform = 'translateZ(8px) rotateY(18deg)';
                }

                controller_knob.appendChild(controller_knob_side);
            }

            document.addEventListener('mousemove', function (e) {
                e.preventDefault();

                if (controller_active) {
                    if (axis === 'y') {
                        updated_position = e.clientY - mouse_start.y;
                    }
                    else {
                        updated_position = (e.clientX - mouse_start.x) * (axis === 'z' ? -1 : 1);
                    }

                    self['update' + transform_type](axis, updated_position);
                }
            });
        }
        else if (transform_type === 'Rotation') {
            document.addEventListener('mousemove', function (e) {
                e.preventDefault();

                if (controller_active) {

                    updated_position = (e.clientY - mouse_start.y) + (e.clientX - mouse_start.x);
                    if (axis === 'x') {
                        updated_position *= -1;
                    }

                    self['update' + transform_type](axis, updated_position);
                }
            });
        }

        controller_knob.addEventListener('mousedown', function (e) {
            e.preventDefault();

            mouse_start.x = e.clientX;
            mouse_start.y = e.clientY;

            if (transform_type === 'Rotation') {
                mouse_start.top = self.local_transform_controller.el().getBoundingClientRect().top;
                mouse_start.left = self.local_transform_controller.el().getBoundingClientRect().left;
            }

            controller_active = true;
            controller_knob.classList.toggle('active_knob');
        });

        document.addEventListener('mouseup', function (e) {
            e.preventDefault();

            if (controller_active) {
                controller_active = false;
                controller_knob.classList.toggle('active_knob');
                addToTransformHistory(self.transforms);
            }
        });

        return controller_knob;
    }

    function controllerHandle(i) {
        var axis = self.axes[i];
        var controller_handle = document.createElement('div');

        var controller_handle_side;
        var j;

        for (j = 0; j < 4; j++) {
            controller_handle_side = document.createElement('div');
            controller_handle_side.className = 'controller-handle-side three-d ' + axis + '-axis-color';

            if (j === 1) {
                controller_handle_side.style.transform = 'translateY(4px) translateZ(4px) rotateX(90deg)';
            }
            else if (j === 2) {
                controller_handle_side.style.transform = 'translateZ(8px)';
            }
            else if (j === 3) {
                controller_handle_side.style.transform = 'translateY(-4px) translateZ(4px) rotateX(90deg)';
            }

            controller_handle.appendChild(controller_handle_side);
        }

        controller_handle.className = 'handle three-d ' + axis + '-axis ' + axis + '-axis-transform';

        return controller_handle;
    }

    function HistoryController(i) {
        var command = ['undo', 'redo'][i];
        var direction = [-1, 1][i];
        var controller = document.createElement('div');

        controller.style.fontSize = '38px';
        controller.style.padding = ' 2px 10px';
        controller.style.backgroundColor = '#ddd';
        controller.style.transform = 'translateY(6px) translateX(' + (6 + (i * 100)) + 'px)';
        controller.innerHTML = command;
        applyAxisControllerStyles(controller);

        // REMOVE TO SHOW HISTORY CONTROLLER
        controller.style.display = 'none';

        controller.addEventListener('click', function (e) {
            e.preventDefault();
            setPositionFromTransformHistory(direction);
        });

        this.el = function () {
            return controller;
        };
    };

    this.updateGlobalRotation = function (axis, amount) {
        this.transforms.global.rotation[axis] = amount;
        this.updatePosition();
    };
    this.updateTranslation = function (axis, amount) {
        this.transforms.local.translation[axis] = amount * 10;
        this.updatePosition();
    };
    this.updateRotation = function (axis, amount) {
        this.transforms.local.rotation[axis] = amount;
        this.updatePosition();
    };
    this.updateScale = function (axis, amount) {
        this.transforms.local.scale[axis] = amount / 10;
        this.updatePosition();
    };

    this.updatePosition = function () {
        // global rotation occurs before translation, therefore, translation is relative to the new origin determined by a global rotation
        var global_transform =  '' +
                                'rotateY(' + this.transforms.global.rotation.y + 'deg)' +
                                'rotateX(' + this.transforms.global.rotation.x + 'deg)' +
                                'rotateZ(' + this.transforms.global.rotation.z + 'deg)' +
                                'translateX(' + this.transforms.local.translation.x + 'px)' +
                                'translateY(' + this.transforms.local.translation.y + 'px)' +
                                'translateZ(' + (-5000 + this.transforms.local.translation.z) + 'px)' +
                                '';

        var local_transform =   '' +
                                'rotateY(' + this.transforms.local.rotation.y + 'deg)' +
                                'rotateX(' + this.transforms.local.rotation.x + 'deg)' +
                                'rotateZ(' + this.transforms.local.rotation.z + 'deg)' +
                                'scaleX(' + (5 + this.transforms.local.scale.x) +')' +
                                'scaleY(' + (5 + this.transforms.local.scale.y) +')' +
                                'scaleZ(' + (5 + this.transforms.local.scale.z) +')' +
                                '';

        global_transform_wrapper.style.transform = global_transform;
        local_transform_wrapper.style.transform = local_transform;
    };

    this.setPositionFromArray = function (transform_array) {
        var axes = self.axes;

        var i,
            axis;

        for (i = 0; i < axes.length; i++) {
            axis = axes[i];
            this.transforms.global.rotation[axis] = transform_array[i];
            this.transforms.local.translation[axis] = transform_array[3 + i];
            this.transforms.local.rotation[axis] = transform_array[6 + i];
            this.transforms.local.scale[axis] = transform_array[9 + i];
        }

        this.updatePosition();
        addToTransformHistory(this.transforms);
    };

    this.getArrayFromPosition = function (transform_object) {
        var transforms_array = [],
            axes = self.axes;

        var i,
            axis;

        for (i = 0; i < axes.length; i++) {
            axis = axes[i];
            transforms_array[i] = transform_object.global.rotation[axis];
            transforms_array[3 + i] = transform_object.local.translation[axis];
            transforms_array[6 + i] = transform_object.local.rotation[axis];
            transforms_array[9 + i] = transform_object.local.scale[axis];
        }

        return transforms_array;
    };

    function addToTransformHistory (transform_obj) {
        self.transformHistory.splice(
            self.transformHistoryState + 1,             // starting at the next slot in the history array after the current one,
            self.transformHistory.length,               // delete everything after it,
            self.getArrayFromPosition(transform_obj)  // and add the new transform as an array
        );
        self.transformHistoryState = self.transformHistory.length - 1;
    }

    function setPositionFromTransformHistory (direction) {
        var new_transform_history_state = self.transformHistoryState + direction;
        if (new_transform_history_state >= 0 && new_transform_history_state < self.transformHistory.length) {
            self.setPositionFromArray(self.transformHistory[new_transform_history_state]);
            self.transformHistoryState += direction;
        }
    }

    this.el = function () {
        return global_transform_wrapper;
    };
}

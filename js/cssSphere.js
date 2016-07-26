
/*
********************************************************
    API
********************************************************
*/

function CssSphere (containerId) {
    var self = this;

    this.sphere = document.getElementById('cssSphere');

    this.container = document.getElementById(containerId || 'cssSphereContainer');

    this.perspective = function () {
        // TODO:
        return (self.sceneHeight / 2) + (self.sceneHeight / 8) + (self.sceneHeight / 32) + (self.sceneHeight / 128);
    };

    this.rotation = function () {
        var camera = document.getElementById('cssSphereCamera');

        return camera.components.rotation.data;
    };

    this.generateScene = function (src, editMode, callback) {
        var ext = src.split('.').pop(),
            aCamera = document.createElement('a-entity'),
            sceneBackground = document.createElement('a-sky');

        self.editMode = !!editMode;

        // Create AFrame scene (sets up THREEjs scene)
        self.aScene = document.createElement('a-scene');

        // Create Camera for AFrame scene (this is necessary in order to give camera an id)
        aCamera.setAttribute('camera', '');
        aCamera.setAttribute('look-controls', '');
        aCamera.setAttribute('id', 'cssSphereCamera');
        self.aScene.appendChild(aCamera);

        // If video or image is provided, set media source
        if (['mp4', 'jpg', 'jpeg', 'png', 'svg', 'gif', 'tiff'].indexOf(ext) > -1) {
            sceneBackground.setAttribute('src', src);
        }
        else { // otherwise, user can enter a color
            sceneBackground.setAttribute('color', src || "#fff");
        }

        self.aScene.appendChild(sceneBackground);

        // create cssSphere div. This will hold all DOM elements in the 3d sphere
        self.sphere = document.createElement('div');
        self.sphere.setAttribute('id', 'cssSphere');

        // Add scene to DOM
        self.container.appendChild(self.aScene);
        self.container.appendChild(self.sphere);
        self.sphere.style.transform = 'perspective(' + self.perspective() + 'px) translateX(0) translateY(0) translateZ(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';

        self.addDOMElementsFromClass();

        window.addEventListener("loaded", function (e, t) {
            self.sceneHeight = self.aScene.canvas.clientHeight;
            self.rotate(0);
        });

        if (callback && typeof callback === 'function') {
            callback();
        }
    };

    this.visibleDOMElements = [];

    this.addDOMElementToScene = function (elementId, transformArray) {
        var dom_element = document.getElementById(elementId);
        var css_sphere_dom_element = new CssSphereDOMElement(dom_element);
        self.addElementToScene(css_sphere_dom_element, transformArray);
    };
    this.addDOMElementsFromClass = function (classname) {
        var dom_elements = document.getElementsByClassName(classname);

        var i,
            css_sphere_dom_element;

        for (i = 0; i < dom_elements.length; i++) {
            css_sphere_dom_element = new CssSphereDOMElement(dom_elements[i]);
            self.addElementToScene(css_sphere_dom_element);
        }
    };
    this.addElementToScene = function (css_sphere_dom_element, transformArray) {
        css_sphere_dom_element.parentSphere = self;
        if (self.editMode) {
            css_sphere_dom_element.setupControllers();
        }
        css_sphere_dom_element.setPositionFromArray(transformArray || [0,0,0,0,0,0,0,0,0,0,0,0]);
        self.sphere.appendChild(css_sphere_dom_element.el());
        self.visibleDOMElements.push(css_sphere_dom_element);
    };

    this.rotate = function (cycle) {
        window.requestAnimationFrame(function () {
            var rotation = self.rotation();
            var activeDOMElement;
            var i;

            self.sphere.style.transform = 'perspective(' + self.perspective() + 'px) translateX(0) translateY(0) translateZ(0) rotateX(' + rotation.x + 'deg) rotateY(' + -rotation.y + 'deg)';

            for (i = 0; i < self.visibleDOMElements.length; i++) {
                activeDOMElement = self.visibleDOMElements[i];
                if (activeDOMElement.activeGlobalRotationControllers.x) {
                    activeDOMElement.updateGlobalRotation('x', -rotation.x + -activeDOMElement.startingRotation.x);
                }
                if (activeDOMElement.activeGlobalRotationControllers.y) {
                    activeDOMElement.updateGlobalRotation('y', rotation.y + activeDOMElement.startingRotation.y);
                }
            }

            self.rotate(cycle + 1);
        });
    };
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
    }

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

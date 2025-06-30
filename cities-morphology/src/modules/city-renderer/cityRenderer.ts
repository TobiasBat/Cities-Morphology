import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import CameraControls from 'camera-controls';
import { type PathSimulationAnimation, type CityGrid, getCoordinatesOfAgent, isPathCurrentlyActive } from 'city-grid';
import { Line2, LineSegments2, LineSegmentsGeometry } from 'three/examples/jsm/Addons.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { scaleLinear } from '@/scripts/mathUtilitis';
import env1Path from './assets/studio_small_08_8k.jpg'
import { CityMaterials, defaultProperties } from './default';
import { buildingsGeometry, heatmapGeometry, getLineCoordinatesFromPath, propertiesGeometry, getCellVertices } from './cityGeometry';
import { toRGBString } from './default'

type CityRendererOptionalParm = {
    doneCallback?: () => void,
    prettyShadows?: boolean,
    debug: boolean
}

/**
 * This class creates a three dimensional visualization of a CityGrid and a animated Path Simulation. 
 * Representing the the city grid with model houses that correspond in there shape with the city grid's parameters.
 * Agents are shown as circles that wander through the city, and it adds colored tubes to highlight edge parameters. 
 */
export class CityRenderer {
    cityGrid: CityGrid | undefined
    animatedPathSimulation: PathSimulationAnimation | undefined

    SIMULATION_START_TIME = 0
    simulationTime = 0
    simulationClock = new THREE.Clock()

    cityCanvasContainer: HTMLElement
    renderer: THREE.WebGLRenderer
    alive = true

    scene; camera; controls; composer
    propertiesGeometry; buildingGeometry; streetGeometry; agentGeometry; groundGeometry; groundPlane; buildingMesh

    agentMesh: THREE.InstancedMesh | undefined
    agentPathMeshes: Line2[] = []

    labelContainer: HTMLElement

    parm = defaultProperties()

    // // Scene Groups 
    edgeVisualizationGroup = new THREE.Group()
    agentsGroup = new THREE.Group()
    agentsPathGroup = new THREE.Group()
    heatMapGroup = new THREE.Group()
    lightGroup = new THREE.Group()

    agentMaterial = CityMaterials.agents()
    propertiesMaterial = CityMaterials.properties(this.parm.cityColors.properties)
    buildingMaterial = CityMaterials.building(this.parm.cityColors.main)
    heatMapMaterial = CityMaterials.heatMap()
    streetMaterial = CityMaterials.street(this.parm.cityColors.street)

    stats: Stats | undefined
    downloadImageButton: HTMLButtonElement | undefined

    // Callbacks 
    callbacks = {
        done: undefined as undefined | (() => void)
    }

    /**
     * Creates Canvas and City Scene inside HTML Container
     * Does not delete content inside container
     * @param container container for canvas
     * @param parm optional parameters for city renderer
     */
    constructor(container: HTMLElement, parm?: CityRendererOptionalParm) {
        this.cityCanvasContainer = container
        this.labelContainer = document.createElement('div')
        this.labelContainer.style.width = '0%'
        this.labelContainer.style.height = '0%'
        this.labelContainer.style.pointerEvents = 'none'
        this.cityCanvasContainer.appendChild(this.labelContainer)

        this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, preserveDrawingBuffer: true })
        this.renderer.setClearAlpha(1.0)
        this.renderer.setClearColor(new THREE.Color('rgb(0, 0, 0)'), 0.0)

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(30, 100 / 100, 20, 3500);
        CameraControls.install({ THREE: THREE })
        this.controls = new CameraControls(this.camera, this.renderer.domElement);
        this.controls.smoothTime = 0.4
        this.controls.rotateAzimuthTo(this.parm.homePerspective.azimuth, false)
        this.controls.rotatePolarTo(this.parm.homePerspective.polar, false)


        this.propertiesGeometry = new THREE.BufferGeometry
        this.buildingGeometry = new THREE.BufferGeometry
        this.streetGeometry = new THREE.BufferGeometry
        this.agentGeometry = new THREE.SphereGeometry(.8, 16, 8);
        this.groundGeometry = new THREE.CircleGeometry(1, 64 * 2)
        this.groundPlane = new THREE.Mesh()
        this.buildingMesh = new THREE.Mesh()

        this.composer = new EffectComposer(this.renderer)

        this.setProperties(parm)
        this.initScene()

        const resizeObserver = new ResizeObserver(() => { this.onWindowResize() })
        resizeObserver.observe(this.cityCanvasContainer)
    }

    /**
    *  Adds Houses and other space geometry 
    */
    private addHouses() {
        const propertiesMesh = new THREE.Mesh(this.propertiesGeometry, this.propertiesMaterial)
        propertiesMesh.receiveShadow = true
        propertiesMesh.castShadow = true
        this.scene.add(propertiesMesh)

        this.buildingMesh = new THREE.Mesh(this.buildingGeometry, this.buildingMaterial)
        this.buildingMesh.castShadow = true
        this.buildingMesh.receiveShadow = true
        this.scene.add(this.buildingMesh)
    }

    /**
     * Adds the Street Mesh
     */
    private addStreets() {
        const streetMesh = new THREE.Mesh(this.streetGeometry, this.streetMaterial)
        streetMesh.receiveShadow = true
        streetMesh.castShadow = false
        this.scene.add(streetMesh)
    }

    /**
     * Adds the agents and the paths of the agents to the scene
     * @param option 
     */
    addAgents(option?: { animatedPathSimulation?: PathSimulationAnimation, gradientDomain?: [number, number, number], gradientRange?: [number, number, number][] }) {
        if (option?.animatedPathSimulation)
            this.animatedPathSimulation = option.animatedPathSimulation
        if (option?.gradientDomain)
            this.parm.agent.domain = option.gradientDomain
        if (option?.gradientRange)
            this.parm.agent.range = option.gradientRange

        // Removing All Agent Mesh and the paths
        if (this.agentMesh) {
            this.agentsGroup.remove(this.agentMesh)
        }
        this.agentPathMeshes.forEach(line => {
            this.agentsPathGroup.remove(line)
        })
        this.agentPathMeshes = []

        if (!this.animatedPathSimulation) return

        this.agentMesh = new THREE.InstancedMesh(this.agentGeometry, this.agentMaterial, this.animatedPathSimulation.length)

        for (let i = 0; i < this.animatedPathSimulation.length; i++) {
            const matrix = new THREE.Matrix4()
            matrix.setPosition(0, 30, 0)
            this.agentMesh.setMatrixAt(i, matrix)
            const colorVec = scaleLinear(
                this.parm.agent.domain,
                this.parm.agent.range,
                this.animatedPathSimulation[i].pathLength
            )
            this.agentMesh.setColorAt(
                i,
                new THREE.Color().fromArray(colorVec)
            )
        }

        this.agentMesh.castShadow = true
        this.agentMesh.receiveShadow = false
        this.agentsGroup.add(this.agentMesh)
    }

    /**
     * To set a new city. Updates houses, streets, ground plate accordingly 
     * @param cityGrid 
     */
    updateCity(cityGrid: CityGrid) {
        this.cityGrid = cityGrid
        this.updateHouses()
        this.updateStreets()
        this.groundPlane.scale.x = cityGrid.shape.minorAxis * 0.5 + 20// * 1.8
        this.groundPlane.scale.y = cityGrid.shape.majorAxis * 0.5 + 20// * 1.8
    }

    /**
     * Adds a new heaptmap for the street paths. 
     * Removes the old one
     */
    addHeatmap(property: 'numberPaths' | 'averageDist' | 'none', options?: { animatedPathSimulation?: PathSimulationAnimation, gradientDomain?: [number, number, number], gradientRange?: [number, number, number][] }) {
        if (!this.cityGrid) return

        if (options?.animatedPathSimulation)
            this.animatedPathSimulation = options.animatedPathSimulation
        if (options?.gradientRange)
            this.parm.heatmap.range = options.gradientRange
        if (options?.gradientDomain)
            this.parm.heatmap.domain = options.gradientDomain


        this.heatMapGroup.children.forEach((child) => {
            this.heatMapGroup.remove(child)
        })

        if (property != 'none') {
            const heatmapData = heatmapGeometry(
                this.cityGrid,
                this.parm.heatmap.domain,
                this.parm.heatmap.range,
                property
            )

            if (!heatmapData) return

            const heatMapGeometry = new LineSegmentsGeometry()
            heatMapGeometry.setPositions(heatmapData.positions)
            heatMapGeometry.setColors(heatmapData.vertexColors)

            const lines = new LineSegments2(
                heatMapGeometry,
                this.heatMapMaterial
            )
            lines.receiveShadow = false
            this.heatMapGroup.add(lines)
        }
    }

    /**
     * @param parm costume parameters of city Renderer
     */
    private setProperties(parm?: CityRendererOptionalParm) {
        if (parm) {
            if (parm.doneCallback)
                this.callbacks.done = parm.doneCallback
            if (parm.prettyShadows)
                this.parm.prettyShadows = parm.prettyShadows
            if (parm.debug !== undefined)
                this.parm.debug = parm.debug
        }
    }

    /**
     * To set properties of materials. Can be used after materials have created.
     * Should effect rendering at next frame.
     * @param options 
     */
    setMaterialProperties(options: { buildingOpacity?: number, agentOpacity?: number }) {
        if (options.buildingOpacity) {
            this.buildingMaterial.opacity = options.buildingOpacity
        }
        if (options.agentOpacity)
            this.agentMaterial.opacity = options.agentOpacity
    }

    /**
     * To add numbered start and endpoint labels of all path
     * Increases number of elements in dome
     */
    addStartEndPointLabels() {
        if (!this.animatedPathSimulation) return

        for (let i = 0; i < this.animatedPathSimulation.length; i++) {
            const pathStartLabel = document.createElement('div')
            const pathEndLabel = document.createElement('div')

            pathStartLabel.setAttribute('class', 'pathLabel start')
            pathEndLabel.setAttribute('class', 'pathLabel end')
            pathStartLabel.innerHTML = `Start ${i + 1} `
            pathEndLabel.innerHTML = `End ${i + 1} `
            this.labelContainer.appendChild(pathStartLabel)
            this.labelContainer.appendChild(pathEndLabel)
        }
    }

    /**
     * Adds numbered labels for all agents. 
     */
    addAgentLabels() {
        if (!this.agentMesh || !this.animatedPathSimulation) return

        for (let i = 0; i < this.animatedPathSimulation.length; i++) {
            const agentLabel = document.createElement('div')
            agentLabel.setAttribute('class', 'agentLabel')
            agentLabel.innerHTML = `Agent ${i + 1} `
            this.labelContainer.appendChild(agentLabel)
        }
    }

    /**
     * Updates the position of the Agents-labels.
     * Slow do not use for many agents
     */
    private updatingAgentLabel() {
        const agentLabelElements = document.getElementsByClassName('agentLabel')
        const width = this.cityCanvasContainer.getBoundingClientRect().width
        const height = this.cityCanvasContainer.getBoundingClientRect().height

        if (!this.agentMesh) return


        for (let i = 0; i < agentLabelElements.length; i++) {
            const posMatrix = new THREE.Matrix4()
            this.agentMesh.getMatrixAt(i, posMatrix)
            const pos = new THREE.Vector3(posMatrix.elements[12], posMatrix.elements[13], posMatrix.elements[14])
            const projectedPos = pos.project(this.camera)

            const labelElement: HTMLElement = agentLabelElements[i] as unknown as HTMLElement
            labelElement.style.transform = `translate(${width / 2 + projectedPos.x * width / 2}px, ${height / 2 - projectedPos.y * height / 2}px) translate(-50%, calc(-100% - 6px))`
        }
    }

    private updatingStartEndPointLabels() {
        if (!this.animatedPathSimulation || !this.cityGrid) return

        const pathLabelStartElements = document.getElementsByClassName('pathLabel start')
        const pathLabelEndElements = document.getElementsByClassName('pathLabel end')
        const width = this.cityCanvasContainer.getBoundingClientRect().width
        const height = this.cityCanvasContainer.getBoundingClientRect().height

        for (let i = 0; i < pathLabelStartElements.length; i++) {
            const coordinatesSet = getLineCoordinatesFromPath(this.cityGrid.streetGraph, this.animatedPathSimulation[i].path, 0.5)
            // console.log(coordinatesSet)
            const startPosition = new THREE.Vector3(coordinatesSet[0], coordinatesSet[1], coordinatesSet[2])
            const projectedStartPosition = startPosition.project(this.camera)

            const startLabelElement = pathLabelStartElements[i] as unknown as HTMLElement
            startLabelElement.style.transform = `translate(${width / 2 + projectedStartPosition.x * width / 2}px, ${height / 2 - projectedStartPosition.y * height / 2}px) translate(-50%, calc(-100% - 3px))`

            const lastValueIndex = coordinatesSet.length - 1
            const endPosition = new THREE.Vector3(coordinatesSet[lastValueIndex - 2], coordinatesSet[lastValueIndex - 1], coordinatesSet[lastValueIndex])
            const projectedEndPosition = endPosition.project(this.camera)

            const endLabelElement = pathLabelEndElements[i] as unknown as HTMLElement
            endLabelElement.style.transform = `translate(${width / 2 + projectedEndPosition.x * width / 2}px, ${height / 2 - projectedEndPosition.y * height / 2}px) translate(-50%, calc(-100% - 3px))`
        }
    }

    /**
     * To remove all labels
     * Just cleans the label container
     */
    removeLabels() {
        this.labelContainer.innerHTML = ''
    }

    /**
     * Moves camera to a perspective view, and updates camera controls. 
     * Resets colors and turns of shadows.
     */
    perspectiveView() {
        this.buildingMaterial.vertexColors = true
        this.buildingMaterial.color = new THREE.Color(toRGBString(this.parm.cityColors.main))
        this.streetMaterial.color = new THREE.Color(toRGBString(this.parm.cityColors.street))

        this.updateLights({ shadows: true })

        this.controls.rotateAzimuthTo(this.parm.homePerspective.azimuth, true)
        this.controls.rotatePolarTo(this.parm.homePerspective.polar, true)
        this.fitCityToViewport(true)

        this.controls.polarRotateSpeed = 1
        this.controls.azimuthRotateSpeed = 1
    }

    /**
     * Moves camera to top view and updates camera controls
     * Turns of Shadows, and adapt colors
     */
    topView() {
        this.buildingMaterial.vertexColors = false
        this.buildingMaterial.color = new THREE.Color(0xdddddd).convertSRGBToLinear()
        this.streetMaterial.color = new THREE.Color(0xeeeeee).convertSRGBToLinear()

        this.updateLights({ shadows: false })

        this.controls.rotateAzimuthTo(Math.PI * 0.5, true)
        this.controls.rotatePolarTo(Math.PI * 0, true)
        this.fitCityToViewport(true)

        this.controls.polarRotateSpeed = 0
        this.controls.azimuthRotateSpeed = 0
    }

    private initScene() {
        THREE.ColorManagement.enabled = true

        const width = this.cityCanvasContainer.getBoundingClientRect().width
        const height = this.cityCanvasContainer.getBoundingClientRect().height
        this.camera.aspect = width / height
        const pixelRatio = window.devicePixelRatio;

        this.renderer.setSize(width * pixelRatio, height * pixelRatio, false);
        this.composer.setSize(width * pixelRatio, height * pixelRatio);
        this.renderer.domElement.setAttribute('style', 'width: 100%; height: 100%;')
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.NeutralToneMapping
        this.renderer.toneMappingExposure = 1

        this.cityCanvasContainer.appendChild(this.renderer.domElement)
        this.renderer.domElement.style.setProperty('z-index', '2')

        this.camera.updateProjectionMatrix()

        this.camera.position.z = 50 * 5.5
        this.camera.position.y = 150 * 5.5
        this.camera.position.x = 100 * 5.5

        this.controls.setPosition(100, 100, 150)

        this.controls.minDistance = this.parm.minZoom
        this.controls.maxDistance = this.parm.maxZoom
        this.controls.minPolarAngle = 0
        this.controls.maxPolarAngle = Math.PI / 2 * 0.95
        if (!this.parm.dolly) this.controls.dollySpeed = 0
        this.controls.update(0)

        this.renderer.setClearColor(0x000000, 0)

        const envMap = new THREE.TextureLoader().load(env1Path)
        envMap.mapping = THREE.EquirectangularReflectionMapping
        envMap.colorSpace = THREE.SRGBColorSpace
        this.buildingMaterial.envMap = envMap
        this.propertiesMaterial.envMap = envMap

        let groundPlateColor = this.parm.cityColors.groundPlane
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            groundPlateColor = this.parm.cityColors.groundPlaneDark

        const groundMaterial = CityMaterials.ground({
            color: groundPlateColor,
            envMap: envMap
        })
        this.groundPlane = new THREE.Mesh(this.groundGeometry, groundMaterial);
        if (this.cityGrid) {
            this.groundPlane.scale.x = this.cityGrid.shape.minorAxis * 1.3
            this.groundPlane.scale.y = this.cityGrid.shape.majorAxis * 1.3
        }
        this.groundPlane.rotation.x = - Math.PI / 2;
        this.groundPlane.position.y -= 0.35
        this.groundPlane.receiveShadow = true
        this.groundPlane.castShadow = false
        this.scene.add(this.groundPlane)

        this.updateLights({ shadows: true })

        this.scene.add(this.edgeVisualizationGroup)
        this.scene.add(this.agentsGroup)
        this.scene.add(this.agentsPathGroup)
        this.scene.add(this.heatMapGroup)
        this.scene.add(this.lightGroup)

        let renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        const saoPass = new SAOPass(this.scene, this.camera);
        saoPass.params.saoBias = -1
        saoPass.params.saoIntensity = 0.03
        saoPass.params.saoScale = 100
        saoPass.params.saoKernelRadius = 10
        saoPass.params.saoBlur = false
        saoPass.params.saoBlurRadius = 5
        this.composer.addPass(saoPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        if (this.parm.debug) {
            console.log('THREE VIS COMPONENT SHOW DEBUG INFO')
            this.stats = new Stats();
            this.stats.dom.style.opacity = '0.6'
            this.stats.dom.style.top = 'auto'
            this.stats.dom.style.bottom = '0'
            document.body.appendChild(this.stats.dom);

            // Adding image save button
            this.downloadImageButton = document.createElement('button')
            this.downloadImageButton.id = 'screenshot-button'
            this.downloadImageButton.innerText = 'Save PNG'
            this.downloadImageButton.style.position = 'fixed'
            this.downloadImageButton.style.zIndex = '100'
            this.downloadImageButton.style.left = '0px'
            this.downloadImageButton.style.bottom = '50px'
            this.downloadImageButton.style.opacity = '0.6'

            this.downloadImageButton.addEventListener('click', () => {
                const dataUrl = this.renderer.domElement.toDataURL("image/png")
                const createEl = document.createElement('a');
                createEl.href = dataUrl;
                createEl.download = "cities-morphology";
                createEl.click();
                createEl.remove();
            })
            document.body.appendChild(this.downloadImageButton)
        }

        this.renderer.domElement.addEventListener('dblclick', () => {
            this.fitCityToViewport(true)
        })

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            this.updateLights({ shadows: this.lightsCastShadows() })

            let groundPlateColor = toRGBString(this.parm.cityColors.groundPlane)
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                groundPlateColor = toRGBString(this.parm.cityColors.groundPlaneDark)
            }

            groundMaterial.color = new THREE.Color(groundPlateColor)
            groundMaterial.needsUpdate = true
        })

        this.addHouses()
        this.addStreets()

        this.render()
    }

    /**
     * Render loop for WebGL program
     */
    private render() {
        if (!this.alive) return
        if (!this.parm.render) return
        if (this.stats) this.stats.begin()

        const delta = this.simulationClock.getDelta()
        if (this.simulationTime > this.parm.simulation_last_path_end && this.parm.playSimulation && !this.parm.loop) {
            if (this.callbacks.done) this.callbacks.done()
        }
        else if (this.parm.playSimulation) {
            if (this.simulationTime > this.parm.simulation_last_path_end && this.parm.loop) {
                this.simulationTime = this.SIMULATION_START_TIME
            }
            this.simulationTime += delta
            this.updateAgents(this.simulationTime)
            if (this.parm.updateLabelsPosition) this.updatingAgentLabel()
            if (this.parm.updateLabelsPosition) this.updatingStartEndPointLabels()
        }
        this.controls.update(delta)
        this.composer.render()

        if (this.stats) this.stats.end()

        requestAnimationFrame(() => this.render())
    }

    /**
     * To stop and re-start the agent animation
     * @param play 
     */
    playSimulation(play: boolean) {
        this.parm.playSimulation = play

        if (play) {
            this.simulationTime = this.SIMULATION_START_TIME
            this.simulationClock.start()
        }
    }

    // Updates position off agents; Updates visibility of walking path of agent
    private updateAgents(time: number) {
        if (!this.agentMesh || !this.animatedPathSimulation || !this.cityGrid) return

        for (let i = 0; i < this.animatedPathSimulation.length; i++) {
            const matrix = new THREE.Matrix4()
            const coord = getCoordinatesOfAgent(this.cityGrid.streetGraph, this.animatedPathSimulation[i], 0, time, this.parm.walkingTimePerDistance)
            if (coord[0] === 0 && coord[1] === 0) {
                matrix.setPosition(0, -10000, 0)
            } else {
                matrix.setPosition(coord[1], 2.0, coord[0])
            }
            this.agentMesh.setMatrixAt(i, matrix)
        }
        this.agentMesh.instanceMatrix.needsUpdate = true

        for (let i = 0; i < this.agentPathMeshes.length; i++) {
            if (isPathCurrentlyActive(
                this.animatedPathSimulation[i],
                this.simulationTime, this.parm.walkingTimePerDistance)
            ) {
                this.agentPathMeshes[i].visible = true
            } else {
                this.agentPathMeshes[i].visible = false
            }
        }
    }

    /**
     * Removes all lights and add new lights.
     * @param options
     */
    private updateLights(options?: { shadows?: boolean }) {
        let prevLight = this.lightGroup.children
        while (prevLight.length > 0) {
            this.lightGroup.remove(prevLight[0])
            prevLight = this.lightGroup.children
        }

        const directionalLight1 = new THREE.DirectionalLight()
        const directionalLight2 = new THREE.DirectionalLight()
        const hemisphereLight = new THREE.HemisphereLight()

        directionalLight1.name = 'main light'
        directionalLight2.name = 'secondary light'
        hemisphereLight.name = 'environment light'

        this.lightGroup.add(directionalLight1)
        this.lightGroup.add(hemisphereLight)
        this.lightGroup.add(directionalLight2)

        // Lights 
        directionalLight1.color = new THREE.Color(0xffffff)

        directionalLight1.intensity = 4.0
        directionalLight1.position.set(-20, 80, 30)
        if (options && options.shadows) directionalLight1.castShadow = options.shadows
        directionalLight1.shadow.camera.left = -100
        directionalLight1.shadow.camera.right = 100
        directionalLight1.shadow.camera.top = 100
        directionalLight1.shadow.camera.bottom = -100
        directionalLight1.shadow.mapSize.width = 2048 * (this.parm.prettyShadows ? 4 : 2)
        directionalLight1.shadow.mapSize.height = 2048 * (this.parm.prettyShadows ? 4 : 2)
        directionalLight1.shadow.radius = 0.5
        directionalLight1.shadow.blurSamples = 10

        directionalLight2.color = new THREE.Color(0xffffff)
        directionalLight2.intensity = 0.3
        directionalLight2.position.set(20, 30, -30)
        directionalLight2.castShadow = false

        hemisphereLight.groundColor = new THREE.Color(0xffffff)
        hemisphereLight.color = new THREE.Color(0xffffff)
        hemisphereLight.intensity = 1.0

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            directionalLight1.intensity = 1.5
            directionalLight2.intensity = 0.8
            hemisphereLight.intensity = 1.0
        }
    }

    /**
     * Zooms city to fit viewport
     * @param transition animated zooming
     */
    fitCityToViewport(transition: boolean) {
        this.controls.fitToSphere(this.groundPlane, transition)
            .then(() => {
                if (window.innerWidth < 600) {
                    const controlCoords = new THREE.Spherical()
                    this.controls.getSpherical(controlCoords)
                    this.controls.truck(
                        this.parm.relativeTruckOffsetMobile[0] as number * controlCoords.radius,
                        this.parm.relativeTruckOffsetMobile[1] as number * controlCoords.radius,
                        transition
                    )
                }
            })
    }

    private lightsCastShadows(): boolean {
        let result = false
        let lights = this.lightGroup.children
        lights.forEach((light: any) => {
            if (light.castShadow)
                result = true
        })
        return result
    }

    /**
     * Sets time back to SIMULATION_START_TIME
     */
    resetTime() {
        this.simulationTime = this.SIMULATION_START_TIME
    }

    /**
     * Updates the shape of houses and properties. Has to be called after city has been updated
     */
    private updateHouses() {
        if (!this.cityGrid) return
        const streetWidth = 5
        const propertiesVertices = propertiesGeometry(this.cityGrid, streetWidth)
        this.propertiesGeometry.setAttribute('position', new THREE.BufferAttribute(propertiesVertices, 3))
        this.propertiesGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(propertiesVertices.length), 3))
        this.propertiesGeometry.computeVertexNormals()

        if (!this.cityGrid.cityParameters) return

        const roofColor = new THREE.Color(
            this.parm.cityColors.roofColor[0] as number * 1.,
            this.parm.cityColors.roofColor[1] as number * 1.,
            this.parm.cityColors.roofColor[2] as number * 1.
        )

        const windowColor = new THREE.Color(
            this.parm.cityColors.windowColor[0] as number,
            this.parm.cityColors.windowColor[1] as number,
            this.parm.cityColors.windowColor[2] as number
        )

        const buildingColor = new THREE.Color(1, 1, 1)

        roofColor.convertSRGBToLinear()
        buildingColor.convertSRGBToLinear()
        windowColor.convertSRGBToLinear()

        const buildingVertices = buildingsGeometry(
            this.cityGrid,
            this.cityGrid.cityParameters.buildingFootprint,
            {
                building: [
                    buildingColor.r,
                    buildingColor.g,
                    buildingColor.b
                ],
                roof: [
                    roofColor.r,
                    roofColor.g,
                    roofColor.b
                ],
                windows: [
                    windowColor.r,
                    windowColor.g,
                    windowColor.b
                ]
            }
        )

        this.buildingGeometry.setAttribute('position', new THREE.BufferAttribute(buildingVertices.positions, 3))
        this.buildingGeometry.setAttribute(
            'normal', new THREE.BufferAttribute(new Float32Array(buildingVertices.positions.length), 3)
        )
        if (buildingVertices.vertexColors.length > 0)
            this.buildingGeometry.setAttribute('color', new THREE.BufferAttribute(buildingVertices.vertexColors, 3))

        this.buildingGeometry.computeVertexNormals()
    }

    /**
     * Updates the street geometry
     * changes position and normal attributes of streetGeometry
     */
    private updateStreets() {
        if (!this.cityGrid) return
        const streetVertices = getCellVertices(this.cityGrid)
        this.streetGeometry.setAttribute('position', new THREE.BufferAttribute(streetVertices, 3))
        this.streetGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(streetVertices.length), 3))
        this.streetGeometry.computeVertexNormals()
    }

    private onWindowResize() {
        const width = this.cityCanvasContainer.getBoundingClientRect().width
        const height = this.cityCanvasContainer.getBoundingClientRect().height
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        const pixelRatio = window.devicePixelRatio
        this.renderer.setSize(width * pixelRatio, height * pixelRatio, false)
        this.composer.setSize(width * pixelRatio, height * pixelRatio)
    }

    /**
     * Removes one material from storage
     * @param material 
     */
    private cleanMaterial(material: any) {
        material.dispose()
        // dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key]
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose()
            }
        }
    }

    /**
     * To delete Scene, and all resources on GPU.
     * Should be called before removing object or canvas / container.
     */
    dispose() {
        this.renderer.dispose()
        this.alive = false // indicating that city renderer is no longer usable 

        this.renderer.renderLists.dispose();
        let objectsToRemove: any[] = []

        this.scene.traverse((object: any) => {
            objectsToRemove.push(object)
        })
        objectsToRemove.forEach((object: any) => {
            if (object.isMesh) {
                object.geometry.dispose()
                if (object.material.isMaterial) this.cleanMaterial(object.material)
                else for (const material of object.material) this.cleanMaterial(material)
            }
            this.scene.remove(object)
        })

        this.composer.passes.forEach(pass => {
            this.composer.removePass(pass)
        })
        this.composer.dispose()
        if (this.stats) this.stats.dom.remove()
        if (this.downloadImageButton) this.downloadImageButton.remove()
    }
}
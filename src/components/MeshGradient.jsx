import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'
import { useTheme } from '../contexts/ThemeContext'
import './MeshGradient.css'

export default function MeshBackground() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const lightProps = {
    animate: "on",
    axesHelper: "off",
    brightness: 1.3,
    cAzimuthAngle: 180,
    cDistance: 3.6,
    cPolarAngle: 90,
    cameraZoom: 1,
    color1: "#00d9ff",
    color2: "#ffa894",
    color3: "#b6e0e1",
    destination: "onCanvas",
    embedMode: "off",
    envPreset: "city",
    format: "gif",
    fov: 45,
    frameRate: 10,
    gizmoHelper: "hide",
    grain: "off",
    lightType: "3d",
    pixelDensity: 2.8,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    range: "disabled",
    rangeEnd: 40,
    rangeStart: 0,
    reflection: 0.1,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    shader: "defaults",
    type: "waterPlane",
    uAmplitude: 2.3,
    uDensity: 1.8,
    uFrequency: 5.5,
    uSpeed: 0.3,
    uStrength: 1.9,
    uTime: 0,
    wireframe: false
  }

  const darkProps = {
    animate: "on",
    axesHelper: "off",
    brightness: 0.9,
    cAzimuthAngle: 180,
    cDistance: 3.6,
    cPolarAngle: 90,
    cameraZoom: 1,
    color1: "#00006e",
    color2: "#914e3a",
    color3: "#00004e",
    destination: "onCanvas",
    embedMode: "off",
    envPreset: "dawn",
    format: "gif",
    fov: 45,
    frameRate: 10,
    gizmoHelper: "hide",
    grain: "off",
    lightType: "3d",
    pixelDensity: 2.8,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    range: "disabled",
    rangeEnd: 40,
    rangeStart: 0,
    reflection: 0.3,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    shader: "defaults",
    type: "waterPlane",
    uAmplitude: 2.3,
    uDensity: 1.8,
    uFrequency: 5.5,
    uSpeed: 0.3,
    uStrength: 1.9,
    uTime: 0,
    wireframe: false
  }

  return (
    <div className="mesh-gradient-container" aria-hidden="true">
      <ShaderGradientCanvas style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1 }}>
        <ShaderGradient {...(isDark ? darkProps : lightProps)} />
      </ShaderGradientCanvas>
    </div>
  )
}

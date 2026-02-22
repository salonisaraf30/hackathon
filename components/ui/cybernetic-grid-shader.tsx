"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CyberneticGridShader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mouse = { x: 0.5, y: 0.5 };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;

      void main() {
        vec2 uv = vUv;
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
        vec2 scaledUv = uv * aspect;
        
        // Mouse warp
        vec2 mousePos = uMouse * aspect;
        float mouseDist = distance(scaledUv, mousePos);
        vec2 warp = (scaledUv - mousePos) * 0.02 / (mouseDist + 0.3);
        scaledUv += warp;
        
        // Grid
        float gridSize = 40.0;
        vec2 grid = fract(scaledUv * gridSize);
        float lineX = smoothstep(0.0, 0.03, grid.x) * smoothstep(0.0, 0.03, 1.0 - grid.x);
        float lineY = smoothstep(0.0, 0.03, grid.y) * smoothstep(0.0, 0.03, 1.0 - grid.y);
        float gridLine = 1.0 - min(lineX, lineY);
        gridLine *= 0.08;
        
        // Energy pulse (magenta)
        float pulse = sin(scaledUv.x * 6.0 + uTime * 0.8) * 0.5 + 0.5;
        pulse *= sin(scaledUv.y * 4.0 - uTime * 0.5) * 0.5 + 0.5;
        float pulseIntensity = pulse * 0.015;
        
        // Green grid lines
        vec3 greenColor = vec3(0.0, 1.0, 0.255);
        vec3 magentaColor = vec3(1.0, 0.0, 1.0);
        
        vec3 color = greenColor * gridLine + magentaColor * pulseIntensity;
        float alpha = gridLine + pulseIntensity;
        
        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      material.uniforms.uTime.value += 0.016;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}

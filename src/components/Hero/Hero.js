import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useTheme } from '../../theme/ThemeContext';
import './Hero.css';

const Hero = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();

  const initThree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Central crystalline icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(1.1, 2);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0xB9F36B,
      metalness: 0.05,
      roughness: 0.05,
      transmission: 0.7,
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 2.0,
      ior: 1.5,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // Wireframe overlay
    const wireGeo = new THREE.IcosahedronGeometry(1.13, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xB9F36B,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // Orbital rings
    const rings = [];
    const ringData = [
      { r: 1.9, tube: 0.008, color: 0xB9F36B, opacity: 0.6, rotX: Math.PI / 2.5, rotZ: 0.3 },
      { r: 2.4, tube: 0.005, color: 0x9B8CFF, opacity: 0.4, rotX: 0.8, rotZ: -0.5 },
      { r: 2.9, tube: 0.004, color: 0xB9F36B, opacity: 0.22, rotX: -0.4, rotZ: 1.1 },
    ];
    ringData.forEach(d => {
      const geo = new THREE.TorusGeometry(d.r, d.tube, 8, 128);
      const mat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: d.opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = d.rotX;
      mesh.rotation.z = d.rotZ;
      scene.add(mesh);
      rings.push({ mesh, geo, mat });
    });

    // Particle field
    const isMobile = W < 768;
    const count = isMobile ? 400 : 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0xB9F36B, size: 0.025, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(ptGeo, ptMat);
    scene.add(particles);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const green = new THREE.PointLight(0xB9F36B, 4, 12);
    green.position.set(2, 2, 3);
    scene.add(green);
    const violet = new THREE.PointLight(0x9B8CFF, 3, 12);
    violet.position.set(-2, -1, 2);
    scene.add(violet);
    const rim = new THREE.PointLight(0xffffff, 1.2, 10);
    rim.position.set(0, -3, -2);
    scene.add(rim);

    sceneRef.current = { renderer, scene, camera, ico, wire, rings, particles, ptGeo, ptMat, icoGeo, icoMat, wireGeo, wireMat, lights: { green, violet, rim } };

    // Entrance animations
    ico.scale.set(0, 0, 0);
    wire.scale.set(0, 0, 0);
    rings.forEach(({ mesh }) => mesh.scale.set(0, 0, 0));
    gsap.to(ico.scale, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'elastic.out(1, 0.6)', delay: 0.3 });
    gsap.to(wire.scale, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'elastic.out(1, 0.6)', delay: 0.4 });
    rings.forEach(({ mesh }, i) => {
      gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)', delay: 0.5 + i * 0.15 });
    });

    // Render loop
    const clock = new THREE.Clock();
    const render = () => {
      sceneRef.current.frameId = requestAnimationFrame(render);
      const t = clock.getElapsedTime();

      ico.rotation.y = t * 0.18;
      ico.rotation.x = Math.sin(t * 0.12) * 0.15;
      wire.rotation.y = t * 0.18;
      wire.rotation.x = Math.sin(t * 0.12) * 0.15;
      rings[0].mesh.rotation.y = t * 0.22;
      rings[1].mesh.rotation.y = -t * 0.14;
      rings[1].mesh.rotation.x = 0.8 + t * 0.08;
      rings[2].mesh.rotation.z = t * 0.1;
      particles.rotation.y = t * 0.03;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.8 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    render();

    const onResize = () => {
      const W2 = canvas.clientWidth;
      const H2 = canvas.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);
    sceneRef.current.onResize = onResize;
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      ['.hero-eyebrow', '.hero-title', '.hero-sub', '.hero-ctas', '.hero-scroll-hint'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      });
      return;
    }

    initThree();

    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove);

    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo('.hero-eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4')
      .fromTo('.hero-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .fromTo('.hero-ctas', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .fromTo('.hero-scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');

    return () => {
      window.removeEventListener('mousemove', onMove);
      const { onResize, frameId, renderer, icoGeo, icoMat, wireGeo, wireMat, ptGeo, ptMat, rings } = sceneRef.current;
      if (onResize) window.removeEventListener('resize', onResize);
      if (frameId) cancelAnimationFrame(frameId);
      if (rings) rings.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
      if (icoGeo) icoGeo.dispose();
      if (icoMat) icoMat.dispose();
      if (wireGeo) wireGeo.dispose();
      if (wireMat) wireMat.dispose();
      if (ptGeo) ptGeo.dispose();
      if (ptMat) ptMat.dispose();
      if (renderer) renderer.dispose();
      tl.kill();
    };
  }, [initThree]);

  // Theme-reactive Three.js material/light updates
  useEffect(() => {
    const { icoMat, ptMat, lights } = sceneRef.current;
    if (!icoMat) return;
    if (theme === 'light') {
      icoMat.color.set(0x6BA825);
      icoMat.opacity = 0.7;
      if (ptMat) { ptMat.color.set(0x6BA825); ptMat.opacity = 0.25; }
      if (lights) {
        lights.green.color.set(0x6BA825);
        lights.green.intensity = 2;
        lights.violet.color.set(0x7664D9);
        lights.violet.intensity = 1.5;
        lights.rim.intensity = 2.5;
      }
    } else {
      icoMat.color.set(0xB9F36B);
      icoMat.opacity = 0.92;
      if (ptMat) { ptMat.color.set(0xB9F36B); ptMat.opacity = 0.5; }
      if (lights) {
        lights.green.color.set(0xB9F36B);
        lights.green.intensity = 4;
        lights.violet.color.set(0x9B8CFF);
        lights.violet.intensity = 3;
        lights.rim.intensity = 1.2;
      }
    }
  }, [theme]);

  return (
    <section className="hero">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-overlay" />

      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          Real-time crypto intelligence
        </div>
        <h1 className="hero-title">
          Explore the<br />
          <span className="hero-title-accent">Digital Asset</span><br />
          Universe.
        </h1>
        <p className="hero-sub">
          Navigate the evolving world of digital assets through<br className="hero-br" />
          real-time market intelligence and powerful financial insights.
        </p>
        <div className="hero-ctas">
          <button
            className="hero-btn-primary"
            onClick={() => document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Markets
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <a href="#trending" className="hero-btn-ghost">View Trending</a>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
};

export default Hero;

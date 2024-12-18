import { Color, Vector3 } from "three";

export const GhibliShader = {
  uniforms: {
    colorMap: {
      value: [
        new Color("#427062"),
        new Color("#33594E"),
        new Color("#234549"),
        new Color("#1E363F"),
      ],
    },
    brightnessThresholds: {
      value: [0.9, 0.45, 0.001],
    },
    lightPosition: { value: new Vector3(15, 15, 15) },
  },
  vertexShader: /* glsl */ `
    // Set the precision for data types used in this shader
    precision highp float;
    precision highp int;

    // Variables to pass from vertex to fragment shader
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normal;
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  fragmentShader: /* glsl */ `
    precision highp float;
    precision highp int;

    // Default THREE.js uniforms available to both fragment and vertex shader
    uniform mat4 modelMatrix;

    uniform vec3 colorMap[4];
    uniform float brightnessThresholds[3];
    uniform vec3 lightPosition;
    uniform sampler2D leafTexture;
    uniform float opacity;

    // Variables passed from vertex to fragment shader
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;
      vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );
      vec3 lightVector = normalize( lightPosition - worldPosition );
      float brightness = dot( worldNormal, lightVector );

      vec4 textureColor = texture2D(leafTexture, vUv);

      vec4 final;

      if (brightness > brightnessThresholds[0])
        final = vec4(colorMap[0], opacity) * textureColor;
      else if (brightness > brightnessThresholds[1])
        final = vec4(colorMap[1], opacity) * textureColor;
      else if (brightness > brightnessThresholds[2])
        final = vec4(colorMap[2], opacity) * textureColor;
      else
        final = vec4(colorMap[3], opacity) * textureColor;

      gl_FragColor = vec4( final );
    }`,
};

// IMPORTED FROM https://github.com/craftzdog/ghibli-style-shader ALL CREDIT TO devaslife

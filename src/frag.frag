#version 300 es
precision highp float;

struct PointLight {
  vec3 position;
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;

  float diffuseMultiplier;
  float constant;
  float linear;
  float quadratic;
};

struct DirLight {
  vec3 lightDirection;
  vec4 lightAmbient;
  vec4 lightDiffuse;
  vec4 lightSpecular;
};

#define NR_POINT_LIGHTS 1
uniform PointLight u_pointLights[NR_POINT_LIGHTS];
uniform DirLight u_dirLight;

uniform float u_shine;
uniform vec4 u_materialAmbient;
uniform vec4 u_materialDiffuse;
uniform vec4 u_materialSpecular;

uniform sampler2D u_diffuse;
uniform sampler2D u_specular;

in vec3 v_normal;
in vec3 v_eyeVector;
in vec2 v_textureCoords;
in vec3 v_pos;

out vec4 color;

vec4 computeDirLight (DirLight light, vec3 N, vec3 E) {
  vec3 L = normalize(light.lightDirection);
  float lambertTerm = dot(N, -L);

  vec4 Ia = light.lightAmbient * u_materialAmbient;
  vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);
  
  if (lambertTerm > 0.0) {
    Id = light.lightDiffuse * u_materialDiffuse * lambertTerm * texture(u_diffuse, v_textureCoords);
    vec3 halfDir = normalize(-L + E);
    float specular = pow(max(dot(halfDir, N), 0.), u_shine);
    Is = light.lightSpecular * u_materialSpecular * specular * texture(u_specular, v_textureCoords);
  }

  return vec4(vec3(Ia + Id + Is), 1.0);
}


vec4 computePointLight (PointLight light, vec3 N, vec3 E) {
  vec3 Ia = light.ambient * texture(u_diffuse, v_textureCoords).rgb;

  vec3 L = normalize(light.position - v_pos);
  float lambertTerm = max(dot(N, L), 0.0);
  vec3 Id = light.diffuse * light.diffuseMultiplier * lambertTerm * texture(u_diffuse, v_textureCoords).rgb;

  vec3 R = reflect(-L, N);
  float specular = pow(max(dot(R, E), 0.0), u_shine);
  vec3 Is = light.specular * specular * texture(u_specular, v_textureCoords).rgb;

  float distance = length(light.position - v_pos);
  float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

  Ia *= attenuation;
  Id *= attenuation;
  Is *= attenuation;

  // return vec4(vec3(Ia), 1.);
  return vec4(vec3(Ia + Id + Is), 1.);
}

void main () {
  vec3 N = normalize(v_normal); // normal
  vec3 E = normalize(v_eyeVector); // view direction

  // vec4 r1 = computeDirLight(u_dirLight, N, E);
  vec4 r1;
  
  for (int i = 0; i < NR_POINT_LIGHTS; i++) {
    r1 += computePointLight(u_pointLights[i], N, E);
  }

  color = r1;
}
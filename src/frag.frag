#version 300 es
precision highp float;

struct PointLight {
  vec3 position;
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;

  float constant;
  float linear;
  float quadratic;
};

uniform PointLight u_pointLight;

uniform float u_shine;
uniform vec3 u_lightDirection;
uniform vec4 u_lightAmbient;
uniform vec4 u_lightDiffuse;
uniform vec4 u_lightSpecular;
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

void main () {
  // vec3 L = normalize(u_lightDirection);
  // vec3 N = normalize(v_normal);
  // float lambertTerm = dot(N, -L);

  vec3 ambient = u_pointLight.ambient * texture(u_diffuse, v_textureCoords).rgb;
  
  vec3 N = normalize(v_normal);
  vec3 lightDir = normalize(u_pointLight.position - v_pos);
  float diff = max(dot(N, lightDir), 0.0);
  vec3 Id = u_pointLight.diffuse * diff * texture(u_diffuse, v_textureCoords).rgb;

  // vec3 viewDir = normalize()

  float distance = length(u_pointLight.position - v_pos);
  float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * distance + u_pointLight.quadratic * (distance * distance));

  ambient *= attenuation;
  Id *= attenuation;

  color = vec4(vec3(Id), 1.);

  // vec4 Ia = u_lightAmbient * u_materialAmbient;
  // vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
  // vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);
  
  // if (lambertTerm > 0.0) {
  //   Id = u_lightDiffuse * u_materialDiffuse * lambertTerm;
  //   vec3 E = normalize(v_eyeVector);
  //   vec3 halfDir = normalize(-L + E);
  //   float specular = pow(max(dot(halfDir, N), 0.), u_shine);
  //   Is = u_lightSpecular * u_materialSpecular * specular * texture(u_specular, v_textureCoords);
  // }

  // color = vec4(vec3(Ia + Id + Is), 1.0);
  // color = color * texture(u_diffuse, v_textureCoords);
}
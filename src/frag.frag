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
uniform sampler2D shadowMap;

in vec3 v_normal;
in vec3 v_eyeVector;
in vec2 v_textureCoords;
in vec3 v_pos;
in vec4 FragPosLightSpace;

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

float ShadowCalculation(vec4 fragPosLightSpace, vec3 N, vec3 L)
{
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;
    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(shadowMap, projCoords.xy).r; 
    // get depth of current fragment from light's perspective
    float currentDepth = projCoords.z;
    // check whether current frag pos is in shadow
    float bias = max(0.05 * (1.0 - dot(N, L)), 0.005);  
    float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0;  

    return shadow;
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

  float shadow = ShadowCalculation(FragPosLightSpace, N, L);       
  vec3 lighting = (Ia + (1.0 - shadow) * (Id + Is));    

  // return vec4(vec3(Ia), 1.);
  return vec4(lighting, 1.);
  // return vec4(vec3(Ia + Id + Is), 1.);
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
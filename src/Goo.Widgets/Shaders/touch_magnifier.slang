#define GOO_REPLACES_BACKDROP
#include "goo_effect.slang"

float4 gooEffect(float2 uv, float4 source, float4 backdrop)
{
    float4 mapping = gooPrimitive().params;
    float4 lens = gooParameter(0);
    float2 sampleUv = (uv - 0.5) / lens.z + 0.5 + lens.xy;
    return gooBackdropTexture.Sample(clamp(mapping.xy + sampleUv * mapping.zw, 0.0, 1.0));
}

package ru.volga.tishina.n;

import android.opengl.GLES30;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/** Движок «Тишины»: свет (полусфера + солнце + 8 точечных + фонарик), туман, тонмаппинг ACES, виньетка, блики. */
final class Engine implements GLSurfaceView.Renderer {
    static final String VS = "#version 300 es\n" +
        "layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec2 aU;\n" +
        "uniform mat4 uVP, uM, uLVP; uniform vec2 uRep; out vec3 vW; out vec3 vN; out vec2 vU; out vec4 vL;\n" +
        "void main(){ vec4 w=uM*vec4(aP,1.0); vW=w.xyz; vN=mat3(uM)*aN; vU=aU*uRep; vL=uLVP*w; gl_Position=uVP*w; }\n";
    static final String FS = "#version 300 es\nprecision highp float; precision highp sampler2DShadow;\n" +
        "in vec3 vW; in vec3 vN; in vec2 vU; in vec4 vL; uniform sampler2DShadow uSh; uniform int uShOn;\n" +
        "uniform vec4 uCol; uniform vec3 uEmis; uniform sampler2D uTex; uniform int uHasTex, uUnlit, uNoFog, uCut;\n" +
        "uniform vec3 uSky, uGnd, uDirD, uDirC, uCam, uFogC; uniform float uFogD, uExp, uSpec;\n" +
        "uniform vec4 uPL[8]; uniform vec3 uPC[8]; uniform int uNPL;\n" +
        "uniform vec3 uSpP, uSpD, uSpC; uniform float uSpCos; uniform vec2 uRes; uniform float uVig, uBump;\n" +
        "out vec4 o;\n" +
        "vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }\n" +
        "void main(){\n" +
        " vec4 base=uCol; float hgt=0.0; if(uHasTex==1){ vec4 t=texture(uTex,vU); if(uCut==1){ if(t.a<0.5) discard; t.rgb/=max(t.a,0.01); } hgt=dot(t.rgb,vec3(0.333)); base*=vec4(pow(t.rgb,vec3(2.2)),t.a); }\n" +
        " vec3 c;\n" +
        " if(uUnlit==1) c=base.rgb; else {\n" +
        "  vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n;\n" +
        "  if(uHasTex==1 && uCut==0){ vec3 dpx=dFdx(vW), dpy=dFdy(vW); vec3 r1=cross(dpy,n), r2=cross(n,dpx); float det=dot(dpx,r1); vec2 g=vec2(dFdx(hgt),dFdy(hgt))*uBump; vec3 gr=sign(det)*(g.x*r1+g.y*r2); n=normalize(abs(det)*n-gr); }\n" +
        "  float sh=1.0; if(uShOn==1){ vec3 q=vL.xyz/vL.w*0.5+0.5; if(q.x>0.0&&q.x<1.0&&q.y>0.0&&q.y<1.0&&q.z<1.0){ float b=0.0015; float s=0.0; for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++) s+=texture(uSh,vec3(q.xy+vec2(i,j)/2048.0,q.z-b)); sh=s/9.0; } }\n" +
        "  vec3 L=mix(uGnd,uSky,n.y*0.5+0.5)*(0.72+0.28*sh)+uDirC*max(dot(n,-uDirD),0.0)*sh;\n" +
        "  vec3 V=normalize(uCam-vW); vec3 sp=vec3(0.0);\n" +
        "  for(int i=0;i<8;i++){ if(i>=uNPL) break; vec3 d=uPL[i].xyz-vW; float dl=max(length(d),0.001); float a=clamp(1.0-dl/uPL[i].w,0.0,1.0); a*=a; vec3 l=d/dl;\n" +
        "   L+=uPC[i]*a*max(dot(n,l),0.0); if(uSpec>0.0) sp+=uPC[i]*a*pow(max(dot(n,normalize(l+V)),0.0),40.0)*uSpec; }\n" +
        "  if(uSpC.r+uSpC.g+uSpC.b>0.0){ vec3 d=uSpP-vW; float dl=max(length(d),0.001); vec3 l=d/dl; float cs=dot(-l,uSpD); float cone=smoothstep(uSpCos,uSpCos+0.08,cs); L+=uSpC*cone/(1.0+dl*dl*0.08)*max(dot(n,l),0.0); }\n" +
        "  vec3 Rf=reflect(-V,n); float fr=0.04+0.96*pow(1.0-max(dot(n,V),0.0),5.0); vec3 env=mix(uGnd,uSky,clamp(Rf.y*0.5+0.5,0.0,1.0))*1.4;\n" +
        "  c=base.rgb*L+sp+env*fr*uSpec*1.6; }\n" +
        " c+=uEmis;\n" +
        " if(uNoFog==0){ float dist=length(uCam-vW); float f=1.0-exp(-uFogD*uFogD*dist*dist); c=mix(c,uFogC,f); }\n" +
        " c=aces(c*uExp); vec2 q=gl_FragCoord.xy/uRes-0.5; c*=1.0-uVig*dot(q,q)*1.6;\n" +
        " o=vec4(pow(c,vec3(1.0/2.2)),base.a);\n}\n";
    static final String SVS = "#version 300 es\nlayout(location=0) in vec3 aP; layout(location=1) in vec2 aU; layout(location=2) in vec4 aC;\n" +
        "uniform mat4 uVP; out vec2 vU; out vec4 vC; void main(){ vU=aU; vC=aC; gl_Position=uVP*vec4(aP,1.0); }\n";
    static final String SFS = "#version 300 es\nprecision mediump float; in vec2 vU; in vec4 vC; uniform sampler2D uTex; out vec4 o;\n" +
        "void main(){ vec4 t=texture(uTex,vU); o=vec4(vC.rgb*t.rgb*vC.a*t.a,1.0); }\n";

    // --- постобработка («киношный» кадр) ---
    static final String QVS = "#version 300 es\nout vec2 vUv; void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0); }\n";
    static final String BRIGHT = "#version 300 es\nprecision mediump float; in vec2 vUv; uniform sampler2D uC; uniform vec2 uPx; out vec4 o;\n" +
        "void main(){ vec3 c=vec3(0.0); for(int i=0;i<4;i++){ vec2 q=vec2(float(i&1),float(i>>1))-0.5; c+=texture(uC,vUv+q*uPx*2.0).rgb; } c*=0.25; float l=max(c.r,max(c.g,c.b)); o=vec4(c*smoothstep(0.62,0.95,l),1.0); }\n";
    static final String BLUR = "#version 300 es\nprecision mediump float; in vec2 vUv; uniform sampler2D uC; uniform vec2 uDir; out vec4 o;\n" +
        "void main(){ float w[5]=float[](0.227,0.195,0.122,0.054,0.016); vec3 c=texture(uC,vUv).rgb*w[0]; for(int i=1;i<5;i++){ c+=texture(uC,vUv+uDir*float(i)*1.6).rgb*w[i]; c+=texture(uC,vUv-uDir*float(i)*1.6).rgb*w[i]; } o=vec4(c,1.0); }\n";
    static final String COMP = "#version 300 es\nprecision highp float; in vec2 vUv; uniform sampler2D uC, uB; uniform vec2 uPx; uniform float uT, uVig, uBloom, uGrain, uCA, uSat, uWarm; out vec4 o;\n" +
        "void main(){ vec2 d=vUv-0.5; float r2=dot(d,d);\n" +
        " vec3 c=vec3(texture(uC,vUv-d*uCA*r2).r, texture(uC,vUv).g, texture(uC,vUv+d*uCA*r2).b);\n" +
        " vec3 bl=(texture(uC,vUv+vec2(uPx.x,0.0)).rgb+texture(uC,vUv-vec2(uPx.x,0.0)).rgb+texture(uC,vUv+vec2(0.0,uPx.y)).rgb+texture(uC,vUv-vec2(0.0,uPx.y)).rgb)*0.25; c+=(c-bl)*0.45;\n" +
        " vec3 b=texture(uB,vUv).rgb; c=1.0-(1.0-c)*(1.0-b*uBloom);\n" +
        " float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,uSat); c=mix(c,c*c*(3.0-2.0*c),0.35);\n" +
        " c+=vec3(0.03,0.008,-0.03)*uWarm*smoothstep(0.35,1.0,l)+vec3(-0.015,0.004,0.028)*uWarm*(1.0-smoothstep(0.0,0.45,l));\n" +
        " c*=1.0-uVig*r2*1.9;\n" +
        " float n=fract(sin(dot(vUv*vec2(1733.1,977.3)+uT,vec2(12.9898,78.233)))*43758.5453); c+=(n-0.5)*uGrain;\n" +
        " o=vec4(clamp(c,0.0,1.0),1.0); }\n";
    /** настройки кадра (миры могут менять) */
    boolean post = true; float bloom = 0.55f, grain = 0.035f, ca = 0.012f, sat = 1.12f, warm = 1.0f, bump = 0.018f;
    private int qprog, bprog, blprog, cprog, qVao, fbo, colTex, depthRb, bfA, btA, bfB, btB, PW, PH, BW, BH;
    private void mkTargets() {
        if (fbo != 0) { GLES30.glDeleteFramebuffers(3, new int[]{fbo, bfA, bfB}, 0); GLES30.glDeleteTextures(3, new int[]{colTex, btA, btB}, 0); GLES30.glDeleteRenderbuffers(1, new int[]{depthRb}, 0); }
        PW = W; PH = H; BW = Math.max(1, W / 4); BH = Math.max(1, H / 4);
        int[] t = new int[1]; colTex = tex2d(PW, PH); GLES30.glGenRenderbuffers(1, t, 0); depthRb = t[0]; GLES30.glBindRenderbuffer(GLES30.GL_RENDERBUFFER, depthRb); GLES30.glRenderbufferStorage(GLES30.GL_RENDERBUFFER, GLES30.GL_DEPTH_COMPONENT24, PW, PH);
        GLES30.glGenFramebuffers(1, t, 0); fbo = t[0]; GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, fbo); GLES30.glFramebufferTexture2D(GLES30.GL_FRAMEBUFFER, GLES30.GL_COLOR_ATTACHMENT0, GLES30.GL_TEXTURE_2D, colTex, 0); GLES30.glFramebufferRenderbuffer(GLES30.GL_FRAMEBUFFER, GLES30.GL_DEPTH_ATTACHMENT, GLES30.GL_RENDERBUFFER, depthRb);
        if (GLES30.glCheckFramebufferStatus(GLES30.GL_FRAMEBUFFER) != GLES30.GL_FRAMEBUFFER_COMPLETE) post = false;
        btA = tex2d(BW, BH); GLES30.glGenFramebuffers(1, t, 0); bfA = t[0]; GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, bfA); GLES30.glFramebufferTexture2D(GLES30.GL_FRAMEBUFFER, GLES30.GL_COLOR_ATTACHMENT0, GLES30.GL_TEXTURE_2D, btA, 0);
        btB = tex2d(BW, BH); GLES30.glGenFramebuffers(1, t, 0); bfB = t[0]; GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, bfB); GLES30.glFramebufferTexture2D(GLES30.GL_FRAMEBUFFER, GLES30.GL_COLOR_ATTACHMENT0, GLES30.GL_TEXTURE_2D, btB, 0);
        GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, 0); }
    private int tex2d(int w, int h) { int[] t = new int[1]; GLES30.glGenTextures(1, t, 0); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, t[0]); GLES30.glTexImage2D(GLES30.GL_TEXTURE_2D, 0, GLES30.GL_RGBA8, w, h, 0, GLES30.GL_RGBA, GLES30.GL_UNSIGNED_BYTE, null);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MAG_FILTER, GLES30.GL_LINEAR);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_S, GLES30.GL_CLAMP_TO_EDGE); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_T, GLES30.GL_CLAMP_TO_EDGE); return t[0]; }
    private void quad(int prog, int src, int dst, int w, int h) { GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, dst); GLES30.glViewport(0, 0, w, h); GLES30.glUseProgram(prog); GLES30.glActiveTexture(GLES30.GL_TEXTURE0); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, src); GLES30.glUniform1i(GLES30.glGetUniformLocation(prog, "uC"), 0); }
    private void postPass() {
        GLES30.glDisable(GLES30.GL_DEPTH_TEST); GLES30.glDisable(GLES30.GL_BLEND); GLES30.glDisable(GLES30.GL_CULL_FACE); GLES30.glBindVertexArray(qVao);
        quad(bprog, colTex, bfA, BW, BH); GLES30.glUniform2f(GLES30.glGetUniformLocation(bprog, "uPx"), 1f / PW, 1f / PH); GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, 3);
        for (int i = 0; i < 2; i++) { quad(blprog, btA, bfB, BW, BH); GLES30.glUniform2f(GLES30.glGetUniformLocation(blprog, "uDir"), 1f / BW, 0); GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, 3);
            quad(blprog, btB, bfA, BW, BH); GLES30.glUniform2f(GLES30.glGetUniformLocation(blprog, "uDir"), 0, 1f / BH); GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, 3); }
        quad(cprog, colTex, 0, W, H); GLES30.glActiveTexture(GLES30.GL_TEXTURE1); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, btA); GLES30.glUniform1i(GLES30.glGetUniformLocation(cprog, "uB"), 1);
        GLES30.glUniform2f(GLES30.glGetUniformLocation(cprog, "uPx"), 1f / PW, 1f / PH); GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uT"), (System.nanoTime() / 1e6f) % 1000f);
        GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uVig"), vig); GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uBloom"), bloom); GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uGrain"), grain);
        GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uCA"), ca); GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uSat"), sat); GLES30.glUniform1f(GLES30.glGetUniformLocation(cprog, "uWarm"), warm);
        GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, 3); GLES30.glActiveTexture(GLES30.GL_TEXTURE0); GLES30.glBindVertexArray(0); GLES30.glEnable(GLES30.GL_DEPTH_TEST); }
    // --- сцена ---
    final ArrayList<Group> groups = new ArrayList<>();
    final ArrayList<Light> lights = new ArrayList<>();
    final ArrayList<Spr> loose = new ArrayList<>();
    float[] sky = {0.05f, 0.06f, 0.09f}, gnd = {0.02f, 0.018f, 0.015f}, dirD = {0.4f, -0.6f, 0.5f}, dirC = {0, 0, 0}, fogC = {0.02f, 0.025f, 0.035f}, clear = {0.02f, 0.025f, 0.035f};
    float fogD = 0.011f, exposure = 1.1f, vig = 0.5f, fov = 70;
    float[] spP = new float[3], spD = new float[3], spC = new float[3]; float spCos = 0.9f;
    // --- камера ---
    float cx, cy, cz, yaw, pitch, roll;
    final float[] P = new float[16], V = new float[16], VP = new float[16], tmp = new float[16];
    int W = 1, H = 1;
    World world; Game game;
    private int prog, sprog, dprog; private int[] U = new int[40];
    /** тени от солнца: включает мир */
    boolean shadows = false; float shR = 45; private int shFbo, shTex; final float[] LVP = new float[16];
    static final String DVS = "#version 300 es\nlayout(location=0) in vec3 aP; uniform mat4 uLVP, uM; void main(){ gl_Position=uLVP*uM*vec4(aP,1.0); }\n";
    static final String DFS = "#version 300 es\nprecision mediump float; out vec4 o; void main(){ o=vec4(1.0); }\n";
    private int sVao, sVbo; private FloatBuffer sBuf = ByteBuffer.allocateDirect(9 * 6 * 4 * 4096).order(ByteOrder.nativeOrder()).asFloatBuffer();
    private long last = 0; boolean ready = false;
    Group dome;

    static int compile(int type, String src) {
        int s = GLES30.glCreateShader(type); GLES30.glShaderSource(s, src); GLES30.glCompileShader(s);
        int[] ok = new int[1]; GLES30.glGetShaderiv(s, GLES30.GL_COMPILE_STATUS, ok, 0);
        if (ok[0] == 0) throw new RuntimeException("shader: " + GLES30.glGetShaderInfoLog(s));
        return s;
    }
    static int link(String vs, String fs) {
        int p = GLES30.glCreateProgram(); GLES30.glAttachShader(p, compile(GLES30.GL_VERTEX_SHADER, vs)); GLES30.glAttachShader(p, compile(GLES30.GL_FRAGMENT_SHADER, fs));
        GLES30.glLinkProgram(p); int[] ok = new int[1]; GLES30.glGetProgramiv(p, GLES30.GL_LINK_STATUS, ok, 0);
        if (ok[0] == 0) throw new RuntimeException("link: " + GLES30.glGetProgramInfoLog(p)); return p;
    }
    static final String[] UN = {"uLVP", "uSh", "uShOn", "uVP", "uM", "uRep", "uCol", "uEmis", "uTex", "uHasTex", "uUnlit", "uNoFog", "uSky", "uGnd", "uDirD", "uDirC", "uCam", "uFogC", "uFogD", "uExp", "uSpec", "uPL", "uPC", "uNPL", "uSpP", "uSpD", "uSpC", "uSpCos", "uRes", "uVig", "uCut", "uBump"};
    private int u(String n) { for (int i = 0; i < UN.length; i++) if (UN[i].equals(n)) return U[i]; return -1; }

    @Override public void onSurfaceCreated(GL10 gl, EGLConfig cfg) {
        prog = link(VS, FS); for (int i = 0; i < UN.length; i++) U[i] = GLES30.glGetUniformLocation(prog, UN[i]);
        sprog = link(SVS, SFS); dprog = link(DVS, DFS);
        try { bprog = link(QVS, BRIGHT); blprog = link(QVS, BLUR); cprog = link(QVS, COMP); int[] qv = new int[1]; GLES30.glGenVertexArrays(1, qv, 0); qVao = qv[0]; } catch (RuntimeException ex) { post = false; }
        fbo = 0;
        { int[] t = new int[1]; GLES30.glGenTextures(1, t, 0); shTex = t[0]; GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, shTex);
          GLES30.glTexImage2D(GLES30.GL_TEXTURE_2D, 0, GLES30.GL_DEPTH_COMPONENT24, 2048, 2048, 0, GLES30.GL_DEPTH_COMPONENT, GLES30.GL_UNSIGNED_INT, null);
          GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MAG_FILTER, GLES30.GL_LINEAR);
          GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_S, GLES30.GL_CLAMP_TO_EDGE); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_T, GLES30.GL_CLAMP_TO_EDGE);
          GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_COMPARE_MODE, GLES30.GL_COMPARE_REF_TO_TEXTURE); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_COMPARE_FUNC, GLES30.GL_LEQUAL);
          GLES30.glGenFramebuffers(1, t, 0); shFbo = t[0]; GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, shFbo); GLES30.glFramebufferTexture2D(GLES30.GL_FRAMEBUFFER, GLES30.GL_DEPTH_ATTACHMENT, GLES30.GL_TEXTURE_2D, shTex, 0);
          GLES30.glDrawBuffers(1, new int[]{GLES30.GL_NONE}, 0); GLES30.glReadBuffer(GLES30.GL_NONE); GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, 0); }
        int[] b = new int[1]; GLES30.glGenVertexArrays(1, b, 0); sVao = b[0]; GLES30.glBindVertexArray(sVao); GLES30.glGenBuffers(1, b, 0); sVbo = b[0];
        GLES30.glBindBuffer(GLES30.GL_ARRAY_BUFFER, sVbo); GLES30.glBufferData(GLES30.GL_ARRAY_BUFFER, sBuf.capacity() * 4, null, GLES30.GL_DYNAMIC_DRAW);
        GLES30.glEnableVertexAttribArray(0); GLES30.glVertexAttribPointer(0, 3, GLES30.GL_FLOAT, false, 36, 0);
        GLES30.glEnableVertexAttribArray(1); GLES30.glVertexAttribPointer(1, 2, GLES30.GL_FLOAT, false, 36, 12);
        GLES30.glEnableVertexAttribArray(2); GLES30.glVertexAttribPointer(2, 4, GLES30.GL_FLOAT, false, 36, 20);
        GLES30.glBindVertexArray(0);
        Tex.cache.clear(); card = null; people.clear();
        if (world != null) { groups.clear(); lights.clear(); loose.clear(); world.init(); }
        ready = true; last = System.nanoTime();
    }
    @Override public void onSurfaceChanged(GL10 gl, int w, int h) { W = w; H = h; GLES30.glViewport(0, 0, w, h); if (post) mkTargets(); }

    /** небо-купол с вертикальным градиентом (цвета сверху вниз) */
    void skyDome(int[] cols, float[] stops) {
        android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(4, 256, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas c = new android.graphics.Canvas(bm); android.graphics.Paint p = new android.graphics.Paint();
        p.setShader(new android.graphics.LinearGradient(0, 0, 0, 256, cols, stops, android.graphics.Shader.TileMode.CLAMP)); c.drawRect(0, 0, 4, 256, p);
        int t = Tex.up(bm, false, false); bm.recycle();
        dome = new Group(); Mat m = Mat.unlit(0xffffff).tex(t).two(); m.noFog = true; dome.mb(m).sphere(0, 0, 0, 600, 600, 600); dome.done(); groups.add(0, dome);
    }

    @Override public void onDrawFrame(GL10 gl) {
        long now = System.nanoTime(); float dt = Math.min(0.05f, (now - last) / 1e9f); last = now;
        if (game != null) game.tick(dt);
        if (world != null) world.update(dt);
        if (dome != null) { dome.x = cx; dome.y = cy; dome.z = cz; dome.upd(); }
        if (shadows) shadowPass();
        boolean pp = post && fbo != 0; GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, pp ? fbo : 0);
        GLES30.glViewport(0, 0, W, H);
        GLES30.glClearColor(clear[0], clear[1], clear[2], 1); GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT | GLES30.GL_DEPTH_BUFFER_BIT);
        GLES30.glEnable(GLES30.GL_DEPTH_TEST);
        Matrix.perspectiveM(P, 0, fov, (float) W / H, 0.05f, 700f);
        Matrix.setIdentityM(V, 0);
        if (roll != 0) Matrix.rotateM(V, 0, (float) -Math.toDegrees(roll), 0, 0, 1);
        Matrix.rotateM(V, 0, (float) -Math.toDegrees(pitch), 1, 0, 0);
        Matrix.rotateM(V, 0, (float) -Math.toDegrees(yaw), 0, 1, 0);
        Matrix.translateM(V, 0, -cx, -cy, -cz);
        Matrix.multiplyMM(VP, 0, P, 0, V, 0);
        GLES30.glUseProgram(prog);
        GLES30.glUniformMatrix4fv(u("uVP"), 1, false, VP, 0);
        GLES30.glUniform3fv(u("uSky"), 1, sky, 0); GLES30.glUniform3fv(u("uGnd"), 1, gnd, 0);
        float dl = (float) Math.sqrt(dirD[0] * dirD[0] + dirD[1] * dirD[1] + dirD[2] * dirD[2]);
        GLES30.glUniform3f(u("uDirD"), dirD[0] / dl, dirD[1] / dl, dirD[2] / dl); GLES30.glUniform3fv(u("uDirC"), 1, dirC, 0);
        GLES30.glUniform3f(u("uCam"), cx, cy, cz); GLES30.glUniform3fv(u("uFogC"), 1, fogC, 0);
        GLES30.glUniform1f(u("uFogD"), fogD); GLES30.glUniform1f(u("uExp"), exposure); GLES30.glUniform2f(u("uRes"), W, H); GLES30.glUniform1f(u("uVig"), post ? 0f : vig); GLES30.glUniform1f(u("uBump"), bump);
        GLES30.glUniform3fv(u("uSpP"), 1, spP, 0); GLES30.glUniform3fv(u("uSpD"), 1, spD, 0); GLES30.glUniform3fv(u("uSpC"), 1, spC, 0); GLES30.glUniform1f(u("uSpCos"), spCos);
        GLES30.glUniformMatrix4fv(u("uLVP"), 1, false, LVP, 0); GLES30.glUniform1i(u("uShOn"), shadows ? 1 : 0);
        GLES30.glActiveTexture(GLES30.GL_TEXTURE1); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, shTex); GLES30.glUniform1i(u("uSh"), 1);
        GLES30.glUniform1i(u("uTex"), 0); GLES30.glActiveTexture(GLES30.GL_TEXTURE0);
        // ближайшие точечные источники
        lightPick();
        // непрозрачное
        draw(false);
        // стекло и прозрачное
        GLES30.glEnable(GLES30.GL_BLEND); GLES30.glDepthMask(false);
        draw(true);
        // блики
        sprites();
        GLES30.glDepthMask(true); GLES30.glDisable(GLES30.GL_BLEND);
        if (pp) postPass();
    }
    private final float[] LV = new float[16], LP = new float[16];
    private void shadowPass() {
        float dl = (float) Math.sqrt(dirD[0] * dirD[0] + dirD[1] * dirD[1] + dirD[2] * dirD[2]); float dx = dirD[0] / dl, dy = dirD[1] / dl, dz = dirD[2] / dl;
        // центр — чуть впереди камеры, привязка к сетке, чтобы тени не дрожали
        float fx = cx - (float) Math.sin(yaw) * shR * 0.5f, fz = cz - (float) Math.cos(yaw) * shR * 0.5f; float step = shR * 2 / 2048f * 4; fx = Math.round(fx / step) * step; fz = Math.round(fz / step) * step;
        Matrix.setLookAtM(LV, 0, fx - dx * 120, -dy * 120, fz - dz * 120, fx, 0, fz, 0, 1, 0);
        Matrix.orthoM(LP, 0, -shR, shR, -shR, shR, 1, 260); Matrix.multiplyMM(LVP, 0, LP, 0, LV, 0);
        GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, shFbo); GLES30.glViewport(0, 0, 2048, 2048); GLES30.glClear(GLES30.GL_DEPTH_BUFFER_BIT); GLES30.glEnable(GLES30.GL_DEPTH_TEST);
        GLES30.glDisable(GLES30.GL_CULL_FACE); GLES30.glEnable(GLES30.GL_POLYGON_OFFSET_FILL); GLES30.glPolygonOffset(2f, 4f);
        GLES30.glUseProgram(dprog); int lu = GLES30.glGetUniformLocation(dprog, "uLVP"), mu = GLES30.glGetUniformLocation(dprog, "uM"); GLES30.glUniformMatrix4fv(lu, 1, false, LVP, 0);
        for (Group g : groups) { if (!g.vis || g == dome) continue; for (Obj o : g.objs) { if (!o.vis || o.mat.blend || o.mat.unlit || o.mat.cut) continue; Matrix.multiplyMM(MM, 0, g.M, 0, o.M, 0); GLES30.glUniformMatrix4fv(mu, 1, false, MM, 0); o.mesh.draw(); } }
        GLES30.glDisable(GLES30.GL_POLYGON_OFFSET_FILL); GLES30.glBindVertexArray(0); GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, 0);
    }
    /** повернуть фигуру лицом к камере (только вокруг вертикали) */
    void billboard(Group g, Obj o) { float[] w = wpos(g, o.bx, o.by, o.bz); float a = (float) Math.toDegrees(Math.atan2(cx - w[0], cz - w[2])) - (float) Math.toDegrees(g.ry);
        Matrix.setIdentityM(o.M, 0); Matrix.translateM(o.M, 0, o.bx, o.by, o.bz); Matrix.rotateM(o.M, 0, a, 0, 1, 0); Matrix.scaleM(o.M, 0, o.bw, o.bh, 1); }
    static Mesh card; static final java.util.HashMap<String, Mat> people = new java.util.HashMap<>();
    /** материал вырезанного фото res/tex/people/NAME.png */
    static Mat pmat(String name) { Mat mt = people.get(name); if (mt == null) { mt = Mat.c(0xffffff).tex(Tex.file("res/tex/people/" + name + ".png")).two(); mt.cut = true; people.put(name, mt); } return mt; }
    static Obj card(Group g, String name, float x, float y, float z, float h, float aspect) {
        if (card == null) { MB m = new MB(); m.plane(0, 0.5f, 0, 1, 1, 0, 0); card = m.build(); }
        Obj o = g.add(card, pmat(name)); o.bill = true; o.bx = x; o.by = y; o.bz = z; o.bh = h; o.bw = h * aspect; return o; }
    /** реалистичный человек (вырезанное фото res/tex/people/pN.png): ноги в (x,y,z), рост h */
    static Obj person(Group g, int idx, float x, float y, float z, float h) {
        return card(g, "p" + idx, x, y, z, h, 0.5f); }
    private final float[] pl = new float[32], pc = new float[24];
    private void lightPick() {
        int nL = lights.size(); Light[] best = new Light[8]; float[] bd = new float[8]; int k = 0;
        for (int i = 0; i < nL; i++) { Light L = lights.get(i); if (!L.on) continue; float[] w = wpos(L.grp, L.x, L.y, L.z); float d = (w[0] - cx) * (w[0] - cx) + (w[1] - cy) * (w[1] - cy) + (w[2] - cz) * (w[2] - cz) - L.range * L.range;
            if (k < 8) { best[k] = L; bd[k] = d; k++; } else { int wi = 0; for (int j = 1; j < 8; j++) if (bd[j] > bd[wi]) wi = j; if (d < bd[wi]) { best[wi] = L; bd[wi] = d; } } }
        for (int i = 0; i < k; i++) { float[] w = wpos(best[i].grp, best[i].x, best[i].y, best[i].z); pl[i * 4] = w[0]; pl[i * 4 + 1] = w[1]; pl[i * 4 + 2] = w[2]; pl[i * 4 + 3] = best[i].range; pc[i * 3] = best[i].r; pc[i * 3 + 1] = best[i].g; pc[i * 3 + 2] = best[i].b; }
        GLES30.glUniform4fv(u("uPL"), 8, pl, 0); GLES30.glUniform3fv(u("uPC"), 8, pc, 0); GLES30.glUniform1i(u("uNPL"), k);
    }
    private final float[] wv = new float[4], wv2 = new float[4];
    float[] wpos(Group g, float x, float y, float z) { if (g == null) return new float[]{x, y, z}; wv[0] = x; wv[1] = y; wv[2] = z; wv[3] = 1; Matrix.multiplyMV(wv2, 0, g.M, 0, wv, 0); return new float[]{wv2[0], wv2[1], wv2[2]}; }
    private final float[] MM = new float[16];
    private void draw(boolean blendPass) {
        for (int gi = 0; gi < groups.size(); gi++) { Group g = groups.get(gi); if (!g.vis) continue;
            for (int i = 0; i < g.objs.size(); i++) { Obj o = g.objs.get(i); Mat m = o.mat; if (!o.vis || m.blend != blendPass) continue;
                if (o.bill) billboard(g, o);
                Matrix.multiplyMM(MM, 0, g.M, 0, o.M, 0);
                GLES30.glUniformMatrix4fv(u("uM"), 1, false, MM, 0); GLES30.glUniform1i(u("uCut"), m.cut ? 1 : 0);
                GLES30.glUniform2f(u("uRep"), m.rx, m.ry);
                GLES30.glUniform4f(u("uCol"), m.r, m.g, m.b, m.a); GLES30.glUniform3f(u("uEmis"), m.er, m.eg, m.eb);
                GLES30.glUniform1i(u("uHasTex"), m.tex != 0 ? 1 : 0); if (m.tex != 0) GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, m.tex);
                GLES30.glUniform1i(u("uUnlit"), m.unlit ? 1 : 0); GLES30.glUniform1i(u("uNoFog"), m.noFog ? 1 : 0); GLES30.glUniform1f(u("uSpec"), m.spec);
                if (m.twoSided) GLES30.glDisable(GLES30.GL_CULL_FACE); else GLES30.glEnable(GLES30.GL_CULL_FACE);
                if (blendPass) { if (m.additive) GLES30.glBlendFunc(GLES30.GL_SRC_ALPHA, GLES30.GL_ONE); else GLES30.glBlendFunc(GLES30.GL_SRC_ALPHA, GLES30.GL_ONE_MINUS_SRC_ALPHA); }
                o.mesh.draw(); } }
        GLES30.glBindVertexArray(0);
    }
    private void sprites() {
        float cyw = (float) Math.cos(yaw), syw = (float) Math.sin(yaw), cp = (float) Math.cos(pitch), sp = (float) Math.sin(pitch);
        float rx = cyw, ry = 0, rz = -syw;                       // вправо
        float ux = syw * sp, uy = cp, uz = cyw * sp;             // вверх
        sBuf.clear(); int n = 0;
        ArrayList<Spr> all = new ArrayList<>(loose); for (Group g : groups) if (g.vis) all.addAll(g.sprs);
        for (Spr s : all) { if (!s.vis || s.a <= 0.01f) continue; if (n >= 4000) break;
            float[] w = wpos(s.grp, s.x, s.y, s.z); float dx = w[0] - cx, dy = w[1] - cy, dz = w[2] - cz; float dist = (float) Math.sqrt(dx * dx + dy * dy + dz * dz); if (dist > 260) continue;
            float h = s.s / 2, fade = s.a * Math.min(1f, 260f / (dist + 1f) * 0.25f);
            float[][] c = {{-1, -1, 0, 1}, {1, -1, 1, 1}, {1, 1, 1, 0}, {-1, -1, 0, 1}, {1, 1, 1, 0}, {-1, 1, 0, 0}};
            for (float[] q : c) { sBuf.put(w[0] + (rx * q[0] + ux * q[1]) * h).put(w[1] + (ry * q[0] + uy * q[1]) * h).put(w[2] + (rz * q[0] + uz * q[1]) * h).put(q[2]).put(q[3]).put(s.r).put(s.g).put(s.b).put(fade); }
            n++; }
        if (n == 0) return;
        sBuf.position(0);
        GLES30.glUseProgram(sprog); GLES30.glUniformMatrix4fv(GLES30.glGetUniformLocation(sprog, "uVP"), 1, false, VP, 0);
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, Tex.star()); GLES30.glUniform1i(GLES30.glGetUniformLocation(sprog, "uTex"), 0);
        GLES30.glBindVertexArray(sVao); GLES30.glBindBuffer(GLES30.GL_ARRAY_BUFFER, sVbo); GLES30.glBufferSubData(GLES30.GL_ARRAY_BUFFER, 0, n * 6 * 9 * 4, sBuf);
        GLES30.glDisable(GLES30.GL_CULL_FACE); GLES30.glBlendFunc(GLES30.GL_ONE, GLES30.GL_ONE);
        GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, n * 6); GLES30.glBindVertexArray(0);
    }
    void col3(float[] dst, int rgb, float k) { dst[0] = Mat.lin(((rgb >> 16) & 255) / 255f) * k; dst[1] = Mat.lin(((rgb >> 8) & 255) / 255f) * k; dst[2] = Mat.lin((rgb & 255) / 255f) * k; }
}

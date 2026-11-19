package ru.volga.tishina.n;

import android.opengl.GLES30;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

/** Геометрия в видеопамяти: позиция(3) нормаль(3) uv(2). */
final class Mesh {
    int vao, vbo, count;
    Mesh(float[] d, int n) {
        int[] b = new int[1];
        GLES30.glGenVertexArrays(1, b, 0); vao = b[0];
        GLES30.glBindVertexArray(vao);
        GLES30.glGenBuffers(1, b, 0); vbo = b[0];
        GLES30.glBindBuffer(GLES30.GL_ARRAY_BUFFER, vbo);
        FloatBuffer fb = ByteBuffer.allocateDirect(Math.max(4, n * 4)).order(ByteOrder.nativeOrder()).asFloatBuffer();
        fb.put(d, 0, n).position(0);
        GLES30.glBufferData(GLES30.GL_ARRAY_BUFFER, n * 4, fb, GLES30.GL_STATIC_DRAW);
        GLES30.glEnableVertexAttribArray(0); GLES30.glVertexAttribPointer(0, 3, GLES30.GL_FLOAT, false, 32, 0);
        GLES30.glEnableVertexAttribArray(1); GLES30.glVertexAttribPointer(1, 3, GLES30.GL_FLOAT, false, 32, 12);
        GLES30.glEnableVertexAttribArray(2); GLES30.glVertexAttribPointer(2, 2, GLES30.GL_FLOAT, false, 32, 24);
        GLES30.glBindVertexArray(0);
        count = n / 8;
    }
    void draw() { if (count == 0) return; GLES30.glBindVertexArray(vao); GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, count); }
    void free() { GLES30.glDeleteBuffers(1, new int[]{vbo}, 0); GLES30.glDeleteVertexArrays(1, new int[]{vao}, 0); count = 0; }
}

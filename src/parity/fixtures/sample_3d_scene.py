from manim import *


class SampleThreeDScene(ThreeDScene):
    """Canonical 3D sample fixture."""

    def construct(self):
        axes = ThreeDAxes(x_length=4, y_length=4, z_length=4)

        sphere = Sphere(radius=0.8, color=BLUE, fill_color=BLUE, fill_opacity=0.25)
        sphere.shift(OUT * 0.6)

        line3d = Line3D(start=[-1.2, -1.0, -1.0], end=[1.2, 1.0, 1.0], color=RED)
        self.add(axes, sphere, line3d)

from manim import *
import math


class SampleGraphingVariantsScene(Scene):
    """Canonical graphing variant sample with plane + line graph."""

    def construct(self):
        plane = NumberPlane(x_range=[-4, 4, 1], y_range=[-3, 3, 1])
        axes = Axes(x_range=[-3, 3, 1], y_range=[-2, 4, 1], x_length=6, y_length=4)

        curve = axes.plot(lambda x: math.sin(x) + 1, x_range=[-3, 3], color=BLUE)
        points = axes.plot_line_graph(
            x_values=[-2, -1, 0, 1, 2],
            y_values=[1, 0, 1, 0, 1],
            line_color=GREEN,
            add_vertex_dots=True,
        )

        self.add(plane, axes, curve, points)

from manim import *


class SampleGraphScene(Scene):
    """Real-world style sample with graphing primitives."""

    def construct(self):
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-1, 5, 1],
            x_length=6,
            y_length=4,
        )

        parabola = axes.plot(lambda x: x * x / 2, x_range=[-2, 2], color=BLUE)
        line = axes.plot(lambda x: x + 1, x_range=[-2, 2], color=GREEN)

        self.add(axes, parabola, line)

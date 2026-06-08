from manim import *


class SampleSquareToCircle(Scene):
    """Adapted from the canonical Manim SquareToCircle sample."""

    def construct(self):
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)

        square = Square()
        square.flip(RIGHT)
        square.rotate(-3 * TAU / 8)

        self.play(Create(square))
        self.play(Transform(square, circle))
        self.wait(0.2)

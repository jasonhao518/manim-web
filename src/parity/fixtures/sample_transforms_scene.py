from manim import *


class SampleTransformsScene(Scene):
    """Canonical transform sequence sample."""

    def construct(self):
        square = Square(color=BLUE, fill_color=BLUE, fill_opacity=0.25)
        square.shift(LEFT * 2.5)

        moved_square = square.copy()
        moved_square.shift(RIGHT * 2.0)

        circle = Circle(color=GREEN, fill_color=GREEN, fill_opacity=0.25)
        circle.shift(RIGHT * 0.6)

        triangle = Triangle(color=RED, fill_color=RED, fill_opacity=0.2)
        triangle.shift(RIGHT * 3.0)

        square.become(moved_square)
        circle.scale(0.9)
        circle.shift(LEFT * 0.4)
        triangle.rotate(PI / 10)

        self.add(square, circle, triangle)

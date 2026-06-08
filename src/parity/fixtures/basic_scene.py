from manim import *


class ParityBasicScene(Scene):
    def construct(self):
        circle = Circle(
            radius=1.2,
            color=BLUE,
            fill_color=BLUE,
            fill_opacity=0.35,
            stroke_width=5,
            stroke_opacity=0.9,
        )
        circle.shift(LEFT * 2.5)

        rect = Rectangle(
            width=2.4,
            height=1.6,
            color=RED,
            fill_color=RED,
            fill_opacity=0.2,
            stroke_width=3,
        )
        rect.shift(RIGHT * 2.0)
        rect.shift(UP * 1.1)

        dot = Dot(
            point=[0.5, -1.5, 0],
            radius=0.08,
            color=YELLOW,
            fill_opacity=1.0,
            stroke_width=2,
        )

        segment = Line(
            start=[-1.5, -0.5, 0],
            end=[1.8, -0.8, 0],
            color=GREEN,
            stroke_width=4,
            stroke_opacity=0.8,
        )

        self.add(circle, rect, dot, segment)

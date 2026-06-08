from manim import *


class ParityGeometryComponentsScene(Scene):
    def construct(self):
        circle = Circle(radius=0.8, color=BLUE, fill_color=BLUE, fill_opacity=0.25)
        circle.shift(LEFT * 4.0 + UP * 1.6)

        square = Square(side_length=1.1, color=RED, fill_color=RED, fill_opacity=0.2)
        square.shift(LEFT * 2.2 + UP * 1.6)

        rect = Rectangle(width=1.8, height=1.0, color=GREEN, fill_color=GREEN, fill_opacity=0.2)
        rect.shift(ORIGIN + UP * 1.6)

        triangle = Triangle(color=YELLOW, fill_color=YELLOW, fill_opacity=0.15)
        triangle.scale(0.75)
        triangle.shift(RIGHT * 2.2 + UP * 1.6)

        poly = RegularPolygon(n=5, radius=0.8, color=ORANGE, fill_color=ORANGE, fill_opacity=0.15)
        poly.shift(RIGHT * 4.0 + UP * 1.6)

        line = Line(start=[-4.6, -0.3, 0.0], end=[-3.2, -0.9, 0.0], color=WHITE, stroke_width=4)
        dash = DashedLine(start=[-2.8, -0.2, 0.0], end=[-1.0, -0.8, 0.0], color=WHITE)
        arrow = Arrow(start=[-0.6, -0.8, 0.0], end=[0.9, -0.1, 0.0], color=BLUE)
        dbl = DoubleArrow(start=[1.5, -0.8, 0.0], end=[3.1, -0.2, 0.0], color=RED)

        arc = Arc(radius=0.8, start_angle=0.2, angle=1.8, color=GREEN)
        arc.shift(RIGHT * 4.2 - DOWN * 0.6)

        ellipse = Ellipse(width=1.8, height=1.0, color=PURPLE, fill_color=PURPLE, fill_opacity=0.2)
        ellipse.shift(LEFT * 3.0 - DOWN * 2.0)

        annulus = Annulus(inner_radius=0.3, outer_radius=0.7, color=TEAL, fill_color=TEAL, fill_opacity=0.25)
        annulus.shift(LEFT * 1.1 - DOWN * 2.0)

        sector = Sector(radius=0.8, angle=1.3, color=PINK, fill_color=PINK, fill_opacity=0.25)
        sector.shift(RIGHT * 1.0 - DOWN * 2.0)

        dot = Dot(point=[3.2, -2.0, 0.0], radius=0.08, color=GREEN)

        self.add(
            circle,
            square,
            rect,
            triangle,
            poly,
            line,
            dash,
            arrow,
            dbl,
            arc,
            ellipse,
            annulus,
            sector,
            dot,
        )

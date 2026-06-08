from manim import *


class ParityGrammarPatternsScene(Scene):
    def construct(self):
        left = Dot(point=[-3.0, 1.0, 0.0], color=BLUE, radius=0.09)
        right = Dot(point=[-0.5, 1.0, 0.0], color=RED, radius=0.09)

        connector = Line(left.get_center(), right.get_center(), color=WHITE, stroke_width=3)

        guide = DashedLine(start=[-3.0, 0.0, 0.0], end=[-0.5, 0.0, 0.0], color=GRAY)

        marker = Arrow(start=[0.5, 0.2, 0.0], end=[2.2, 1.0, 0.0], color=GREEN)
        marker.shift(DOWN * 0.2)

        frame = SurroundingRectangle(connector, color=YELLOW, buff=0.2)
        frame.shift(UP * 0.15)

        title = Text("grammar", color=WHITE, font_size=28)
        title.shift(LEFT * 1.75)
        title.shift(UP * 2.0)

        a = Dot(point=[0.0, -1.7, 0.0], color=PURPLE)
        b = Dot(point=[1.4, -1.1, 0.0], color=PURPLE)
        c = Dot(point=[2.7, -1.9, 0.0], color=PURPLE)
        chain = VGroup(a, b, c)
        chain.shift(RIGHT * 0.6)

        seg1 = Line(a.get_center(), b.get_center(), color=ORANGE)
        seg2 = Line(b.get_center(), c.get_center(), color=ORANGE)

        self.add(left, right, connector, guide, marker, frame, title, a, b, c, seg1, seg2)

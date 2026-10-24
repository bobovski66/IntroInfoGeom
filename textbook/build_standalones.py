"""Generate ten independently compilable chapters from the complete manuscript.

Each chapter includes the selected answers associated with its exercises.
The complete book remains the editorial source of truth; this program copies
its LaTeX without altering any mathematics, labels, or figures.
"""

from pathlib import Path
import re

BASE = Path(__file__).resolve().parent
SOURCE = BASE / "information_geometry.tex"
DEST = BASE / "chapters"


def main() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    header, body = source.split(r"\begin{document}", 1)
    chapter_matches = list(re.finditer(r"(?m)^\\chapter\{([^}\n]+)\}", body))
    if len(chapter_matches) != 10:
        raise ValueError(f"Expected 10 chapters, found {len(chapter_matches)}")

    solutions_start = body.index(r"\FloatBarrier\backmatter\chapter*{Selected Solutions}")
    solution_body = body[solutions_start:]
    answer_matches = list(re.finditer(r"(?m)^\\section\*\{Chapter (\d+)\}", solution_body))
    if [int(match.group(1)) for match in answer_matches] != list(range(1, 11)):
        raise ValueError("Could not identify the ten selected-solution sections")

    DEST.mkdir(parents=True, exist_ok=True)
    for offset, match in enumerate(chapter_matches):
        number = offset + 1
        title = match.group(1)
        end = (
            chapter_matches[offset + 1].start()
            if offset + 1 < len(chapter_matches)
            else solutions_start
        )
        chapter_text = body[match.start():end]
        answer_end = (
            answer_matches[offset + 1].start()
            if offset + 1 < len(answer_matches)
            else solution_body.index(r"\begin{thebibliography}")
        )
        answer_text = solution_body[answer_matches[offset].start():answer_end]
        # The standalone has its own compact title, while the source chapter
        # heading and all exercise/figure numbering remain unchanged.
        result = (
            header
            + "\n"
            + rf"\hypersetup{{pdftitle={{Chapter {number}: {title}}}}}"
            + "\n"
            + r"\begin{document}"
            + "\n"
            + r"\mainmatter"
            + "\n"
            + rf"\setcounter{{chapter}}{{{offset}}}"
            + "\n"
            + chapter_text.rstrip()
            + "\n\n"
            + r"\clearpage\backmatter"
            + "\n"
            + r"\chapter*{Selected Solutions}"
            + "\n"
            + answer_text.rstrip()
            + "\n"
            + r"\end{document}"
            + "\n"
        )
        file_name = f"chapter_{number:02d}.tex"
        (DEST / file_name).write_text(result, encoding="utf-8")
        print(f"{file_name}: {title}")


if __name__ == "__main__":
    main()

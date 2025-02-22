DIR=$(notdir ${PWD})

.PHONY: all compile clean rename

all: compile rename clean

compile:
	pdflatex -shell-escape thesis.tex
	bibtex Bibliography
	makeglossaries thesis
	pdflatex -shell-escape thesis.tex
	pdflatex -shell-escape thesis.tex
clean:
	rm *.aux *.log *.out *.bbl *.blg
rename:
	mv main.pdf ${DIR}.pdf
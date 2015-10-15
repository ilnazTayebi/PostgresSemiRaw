stepFile=../static/js/raw_walkthrough_steps.js
all: $(stepFile)
$(stepFile):guide.xml
	./genGuide.py $^ > $@

stepFile=../static/js/raw_walkthrough_steps.js
all: $(stepFile)
$(stepFile):HTTP.xml
	./genGuide.py $^ > $@

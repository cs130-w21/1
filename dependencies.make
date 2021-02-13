.PHONY: junknet_list_all_targets
junknet_list_all_targets:
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make Dependency Info {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$'

.PHONY: junknet_no_targets_brev__ junknet_list_brev
junknet_no_targets_brev__: junknet_list_all_targets_brev__
junknet_list_brev:
	@sh -c "$(MAKE) -p junknet_no_targets_brev__ | awk -F':' '/^[a-zA-Z0-9][^\$$#\/\\t=]*:([^=]|$$)/ {split(\$$1,A,/ /);for(i in A)print A[i]}' | grep -v '__\$$' | sort"

.PHONY: junknet_no_targets__ junknet_list
junknet_no_targets__: junknet_list_all_targets
junknet_list:
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null 
	@sh -c "$(MAKE) -p junknet_no_targets__ | awk -F':' '/^[a-zA-Z0-9][^\$$#\/\\t=]*:([^=]|$$)/ {split(\$$1,A,/ /);for(i in A)print A[i]}' | grep -v '__\$$' | sort"


.PHONY: junknet-pretty-list
junknet-pretty-list:
	@# search all include files for targets.
	@# ... excluding special targets, and output dynamic rule definitions unresolved.
	@for inc in $(MAKEFILE_LIST); do \
	echo ' =' $$inc '= '; \
	grep -Eo '^[^\.#[:blank:]]+.*:.*' $$inc | grep -v ':=' | \
	cut -f 1 | sort | sed 's/.*/  &/' | sed -n 's/:.*$$//p' | \
	tr $$ \\\ | tr $(open_paren) % | tr $(close_paren) % \
	; done

# to get around escaping limitations:
open_paren := \(
close_paren := \)

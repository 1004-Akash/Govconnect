import pytest
from app.models import UserProfile, EligibilityCondition, EligibilityRules
from app.rules_evaluator import RulesEvaluator


class TestRulesEvaluator:
    """Test cases for rules evaluator operators and logic"""
    
    def test_equality_operators(self):
        """Test == and != operators"""
        profile = UserProfile(age=25, gender="female")
        
        # Test ==
        condition_eq = EligibilityCondition(attribute="age", op="==", value=25)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_eq)
        assert passed is True
        
        condition_eq_fail = EligibilityCondition(attribute="age", op="==", value=30)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_eq_fail)
        assert passed is False
        
        # Test !=
        condition_neq = EligibilityCondition(attribute="gender", op="!=", value="male")
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_neq)
        assert passed is True
    
    def test_comparison_operators(self):
        """Test >, >=, <, <= operators"""
        profile = UserProfile(age=25, income=50000)
        
        # Test >
        condition_gt = EligibilityCondition(attribute="age", op=">", value=20)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_gt)
        assert passed is True
        
        # Test >=
        condition_gte = EligibilityCondition(attribute="age", op=">=", value=25)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_gte)
        assert passed is True
        
        # Test <
        condition_lt = EligibilityCondition(attribute="income", op="<", value=60000)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_lt)
        assert passed is True
        
        # Test <=
        condition_lte = EligibilityCondition(attribute="income", op="<=", value=50000)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_lte)
        assert passed is True
    
    def test_truthy_falsy_operators(self):
        """Test truthy and falsy operators"""
        profile = UserProfile(is_student=True, occupation=None)
        
        # Test truthy
        condition_truthy = EligibilityCondition(attribute="is_student", op="truthy", value=None)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_truthy)
        assert passed is True
        
        # Test falsy
        condition_falsy = EligibilityCondition(attribute="occupation", op="falsy", value=None)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_falsy)
        assert passed is True
    
    def test_in_not_in_operators(self):
        """Test in and not_in operators"""
        profile = UserProfile(caste="OBC", state="KA")
        
        # Test in with list
        condition_in = EligibilityCondition(attribute="caste", op="in", value=["SC", "ST", "OBC"])
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_in)
        assert passed is True
        
        # Test in with comma-delimited string
        condition_in_str = EligibilityCondition(attribute="state", op="in", value="KA,TN,AP")
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_in_str)
        assert passed is True
        
        # Test not_in
        condition_not_in = EligibilityCondition(attribute="caste", op="not_in", value=["General"])
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_not_in)
        assert passed is True
    
    def test_between_operator(self):
        """Test between operator"""
        profile = UserProfile(age=25, income=50000)
        
        # Test between - pass
        condition_between = EligibilityCondition(
            attribute="age", 
            op="between", 
            value={"min": 18, "max": 30}
        )
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_between)
        assert passed is True
        
        # Test between - fail
        condition_between_fail = EligibilityCondition(
            attribute="income", 
            op="between", 
            value={"min": 60000, "max": 100000}
        )
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition_between_fail)
        assert passed is False
    
    def test_missing_fields(self):
        """Test handling of missing profile fields"""
        profile = UserProfile(age=25)  # Missing other fields
        
        condition = EligibilityCondition(attribute="income", op=">=", value=10000)
        passed, reason = RulesEvaluator._evaluate_condition(profile, condition)
        assert passed is False
        assert "missing: income" in reason
    
    def test_disqualifier_logic(self):
        """Test disqualifier logic (fail fast)"""
        profile = UserProfile(age=35, income=200000)
        
        rules = EligibilityRules(
            disqualifiers=[
                EligibilityCondition(
                    attribute="income", 
                    op=">", 
                    value=150000, 
                    reason="Income exceeds maximum threshold"
                )
            ],
            all=[
                EligibilityCondition(attribute="age", op=">=", value=18)
            ]
        )
        
        eligible, failed_conditions, passed_conditions = RulesEvaluator.evaluate_scheme(profile, rules)
        assert eligible is False
        assert "Income exceeds maximum threshold" in failed_conditions[0]
    
    def test_any_logic(self):
        """Test 'any' logic - at least one condition must pass"""
        profile = UserProfile(caste="OBC", is_student=False)
        
        rules = EligibilityRules(
            all=[
                EligibilityCondition(attribute="caste", op="in", value=["SC", "ST", "OBC"])
            ],
            any=[
                EligibilityCondition(attribute="is_student", op="==", value=True),
                EligibilityCondition(attribute="caste", op="in", value=["SC", "ST"])
            ]
        )
        
        eligible, failed_conditions, passed_conditions = RulesEvaluator.evaluate_scheme(profile, rules)
        assert eligible is False  # 'any' conditions failed
        assert len(failed_conditions) > 0
    
    def test_successful_evaluation(self):
        """Test successful scheme evaluation"""
        profile = UserProfile(
            age=21,
            gender="female",
            occupation="student",
            is_student=True,
            income=30000,
            caste="OBC",
            state="KA"
        )
        
        rules = EligibilityRules(
            all=[
                EligibilityCondition(attribute="age", op=">=", value=18),
                EligibilityCondition(attribute="income", op="<", value=50000),
                EligibilityCondition(attribute="caste", op="in", value=["SC", "ST", "OBC"])
            ]
        )
        
        eligible, failed_conditions, passed_conditions = RulesEvaluator.evaluate_scheme(profile, rules)
        assert eligible is True
        assert len(failed_conditions) == 0
        assert len(passed_conditions) == 3
    
    def test_rules_json_validation(self):
        """Test rules JSON validation"""
        # Valid rules
        valid_rules = {
            "scheme_id": "test_scheme",
            "scheme_name": "Test Scheme",
            "eligibility": {
                "all": [
                    {"attribute": "age", "op": ">=", "value": 18}
                ]
            }
        }
        
        is_valid, message = RulesEvaluator.validate_rules_json(valid_rules)
        assert is_valid is True
        
        # Invalid rules - missing required key
        invalid_rules = {
            "scheme_name": "Test Scheme"
        }
        
        is_valid, message = RulesEvaluator.validate_rules_json(invalid_rules)
        assert is_valid is False
        assert "Missing required key: scheme_id" in message
        
        # Invalid between operator
        invalid_between = {
            "scheme_id": "test",
            "scheme_name": "Test",
            "eligibility": {
                "all": [
                    {"attribute": "age", "op": "between", "value": "invalid"}
                ]
            }
        }
        
        is_valid, message = RulesEvaluator.validate_rules_json(invalid_between)
        assert is_valid is False

import json
import os

os.makedirs('tests/golden/calculate', exist_ok=True)
os.makedirs('tests/golden/cmplx', exist_ok=True)
os.makedirs('tests/golden/basen', exist_ok=True)
os.makedirs('tests/golden/eqn', exist_ok=True)
os.makedirs('tests/golden/matrix', exist_ok=True)
os.makedirs('tests/golden/vector', exist_ok=True)
os.makedirs('tests/golden/table', exist_ok=True)
os.makedirs('tests/golden/system', exist_ok=True)

cases = [
    {
        "file": "calculate/case_01_frac_add.json",
        "name": "1. Fraction addition 2/3 + 1/2 = 7/6",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["2", "FRAC", "3", "RIGHT", "ADD", "1", "FRAC", "2", "EXE"],
        "expect": {"result": "7/6", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_02_sd_toggle.json",
        "name": "2. S<=>D toggle 7/6 -> 1.166666667",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["2", "FRAC", "3", "RIGHT", "ADD", "1", "FRAC", "2", "EXE", "SD"],
        "expect": {"result": "1.166666667", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_03_lineio_sd.json",
        "name": "3. LineIO 1/5 -> 0.2 -> 1⌋5",
        "source": "guide",
        "setup": {"display": "LineIO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "DIV", "5", "EXE", "SD"],
        "expect": {"result": "1⌋5", "indicators": ["D"]}
    },
    {
        "file": "calculate/case_04_pi_exact.json",
        "name": "4. π/6 -> 1/6 π -> 0.5235987756",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "EXP10", "DIV", "6", "EXE", "SD"],
        "expect": {"result": "0.5235987756", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_05_surd_mul.json",
        "name": "5. (√2 + 2) * √3 = √6 + 2√3",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["LPAREN", "SQRT", "2", "RIGHT", "ADD", "2", "RPAREN", "MUL", "SQRT", "3", "EXE"],
        "expect": {"result": "√6+2√3", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_06_surd_linear_comb.json",
        "name": "6. 10√2 + 15 * 3√3 = 45√3 + 10√2",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "0", "SQRT", "2", "RIGHT", "ADD", "1", "5", "MUL", "3", "SQRT", "3", "EXE"],
        "expect": {"result": "45√3+10√2", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_07_surd_overflow_to_dec.json",
        "name": "7. 99√999 falls back to decimal",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["9", "9", "SQRT", "9", "9", "9", "EXE"],
        "expect": {"result": "3129.089165", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_08_sqrt_8.json",
        "name": "8. √8 = 2√2",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SQRT", "8", "EXE"],
        "expect": {"result": "2√2", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_09_sin_30.json",
        "name": "9. sin 30) = 1/2 in MathO",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SIN", "3", "0", "RPAREN", "EXE"],
        "expect": {"result": "1/2", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_10_sin_30_lineio.json",
        "name": "10. LineIO sin 30) = 0.5",
        "source": "guide",
        "setup": {"display": "LineIO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SIN", "3", "0", "RPAREN", "EXE"],
        "expect": {"result": "0.5", "indicators": ["D"]}
    },
    {
        "file": "calculate/case_11_dec_sum_exact.json",
        "name": "11. 0.1 + 0.2 = 3/10 in MathO",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["0", "DOT", "1", "ADD", "0", "DOT", "2", "EXE"],
        "expect": {"result": "3/10", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_12_neg_square.json",
        "name": "12. (-) 2 x² = -4 priority test",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["NEG", "2", "SQUARE", "EXE"],
        "expect": {"result": "-4", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_13_ten_digit_round.json",
        "name": "13. 12345678901 = 1.23456789×10¹⁰",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "1", "EXE"],
        "expect": {"result": "1.23456789", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_14_norm1_exp.json",
        "name": "14. 1 / 200 in Norm 1 = 5×10⁻³",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "DIV", "2", "0", "0", "EXE"],
        "expect": {"result": "5", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_15_factorial_69.json",
        "name": "15. 69! = 1.711224524×10⁹⁸",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["6", "9", "SHIFT", "RECIP", "EXE"],
        "expect": {"result": "1.711224524", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_16_factorial_70_overflow.json",
        "name": "16. 70! throws Math ERROR",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["7", "0", "SHIFT", "RECIP", "EXE"],
        "expect": {"error": "Math ERROR"}
    },
    {
        "file": "calculate/case_17_div_zero_error.json",
        "name": "17. 14 / 0 * 2 throws Math ERROR",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "4", "DIV", "0", "MUL", "2", "EXE"],
        "expect": {"error": "Math ERROR"}
    },
    {
        "file": "calculate/case_18_tan_90_error.json",
        "name": "18. tan 90) throws Math ERROR",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["TAN", "9", "0", "RPAREN", "EXE"],
        "expect": {"error": "Math ERROR"}
    },
    {
        "file": "calculate/case_19_log_1000.json",
        "name": "19. log 1000) = 3",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["LOG", "1", "0", "0", "0", "RPAREN", "EXE"],
        "expect": {"result": "3", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_20_logab.json",
        "name": "20. log_2(16) = 4",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["LOGBASE", "2", "RIGHT", "1", "6", "EXE"],
        "expect": {"result": "4", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_21_power_expr.json",
        "name": "21. 1.2 * 10^3 = 1200",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "DOT", "2", "MUL", "1", "0", "POWER", "3", "EXE"],
        "expect": {"result": "1200", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_22_cube_power.json",
        "name": "22. (5²)³ = 15625",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["LPAREN", "5", "SQUARE", "RPAREN", "SHIFT", "SQUARE", "EXE"],
        "expect": {"result": "15625", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_23_nth_root.json",
        "name": "23. 5√32 = 2",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "POWER", "5", "RIGHT", "3", "2", "EXE"],
        "expect": {"result": "2", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_24_cbrt_sum.json",
        "name": "24. ∛5 + ∛(-27) = -1.290024053",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "SQRT", "5", "RIGHT", "ADD", "SHIFT", "SQRT", "NEG", "2", "7", "EXE"],
        "expect": {"result": "-1.290024053", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_25_percent.json",
        "name": "25. 150 * 20% = 30",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "5", "0", "MUL", "2", "0", "SHIFT", "LPAREN", "EXE"],
        "expect": {"result": "30", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_26_dms_add.json",
        "name": "26. 2°20'30\" + 0°39'30\" = 3°0'0\"",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["2", "DMS", "2", "0", "DMS", "3", "0", "DMS", "ADD", "0", "DMS", "3", "9", "DMS", "3", "0", "DMS", "EXE"],
        "expect": {"result": "3°0'0\"", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_27_lineio_edit.json",
        "name": "27. LineIO 4*3+2.5=14.5 then edit -7.1 = 4.9",
        "source": "guide",
        "setup": {"display": "LineIO", "angle": "Deg", "format": "Norm1"},
        "keys": ["4", "MUL", "3", "ADD", "2", "DOT", "5", "EXE"],
        "expect": {"result": "14.5", "indicators": ["D"]}
    },
    {
        "file": "calculate/case_28_multistatement.json",
        "name": "28. Multi-statement 3+3 : 3*3",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["3", "ADD", "3", "ALPHA", "INTEGRAL", "3", "MUL", "3", "EXE"],
        "expect": {"result": "6", "indicators": ["Math", "D", "Disp"]}
    },
    {
        "file": "calculate/case_29_eng_notation.json",
        "name": "29. 1234 = ENG ENG",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "2", "3", "4", "EXE", "ENG"],
        "expect": {"result": "1.234", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_30_rnd_fix3.json",
        "name": "30. Fix 3: 10/3*3=10.000 vs Rnd(10/3)*3=9.999",
        "source": "guide",
        "setup": {"display": "LineIO", "angle": "Deg", "format": "Fix3"},
        "keys": ["1", "0", "DIV", "3", "MUL", "3", "EXE"],
        "expect": {"result": "10.000", "indicators": ["D", "FIX"]}
    },
    {
        "file": "calculate/case_31_npr_ncr.json",
        "name": "31. 10 P 4 = 5040, 10 C 4 = 210",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "0", "SHIFT", "MUL", "4", "EXE"],
        "expect": {"result": "5040", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_32_pol_coords.json",
        "name": "32. Pol(√2, √2) = r=2, θ=45",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "ADD", "SQRT", "2", "RIGHT", "SHIFT", "RPAREN", "SQRT", "2", "RIGHT", "RPAREN", "EXE"],
        "expect": {"result": "45", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_33_derivative_sin.json",
        "name": "33. Rad d/dx(sin X)|_π/2 = 0",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Rad", "format": "Norm1"},
        "keys": ["SHIFT", "INTEGRAL", "SIN", "ALPHA", "RPAREN", "RPAREN", "RIGHT", "SHIFT", "EXP10", "DIV", "2", "EXE"],
        "expect": {"result": "0", "indicators": ["Math", "R"]}
    },
    {
        "file": "calculate/case_34_summation.json",
        "name": "34. Σ(X+1, 1, 5) = 20",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "LOGBASE", "ALPHA", "RPAREN", "ADD", "1", "RIGHT", "1", "RIGHT", "5", "EXE"],
        "expect": {"result": "20", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_35_integral_ln.json",
        "name": "35. ∫(ln X, 1, e) = 1",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["INTEGRAL", "LN", "ALPHA", "RPAREN", "RPAREN", "RIGHT", "1", "RIGHT", "ALPHA", "EXP10", "EXE"],
        "expect": {"result": "1", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_36_constant_c0.json",
        "name": "36. CONST 28 (C0) = 299792458",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "7", "2", "8", "EXE"],
        "expect": {"result": "299792458", "indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_37_conv_cm_in.json",
        "name": "37. 5 cm -> in = 1.968503937",
        "source": "unverified",
        "setup": {"display": "LineIO", "angle": "Deg", "format": "Norm1"},
        "keys": ["5", "SHIFT", "8", "0", "2", "EXE"],
        "expect": {"result": "1.968503937", "indicators": ["D"]}
    },
    {
        "file": "calculate/case_38_pi_internal_diff.json",
        "name": "38. π - 3.141592653",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["SHIFT", "EXP10", "SUB", "3", "DOT", "1", "4", "1", "5", "9", "2", "6", "5", "3", "EXE"],
        "expect": {"result": "5.898", "indicators": ["Math", "D"]}
    },
    {
        "file": "cmplx/case_39_cmplx_div.json",
        "name": "39. CMPLX (2+6i)/(2i) = 3-i",
        "source": "guide",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["MODE", "2", "LPAREN", "2", "ADD", "6", "ENG", "RPAREN", "DIV", "LPAREN", "2", "ENG", "RPAREN", "EXE"],
        "expect": {"result": "3-i", "indicators": ["Math", "D", "CMPLX"]}
    },
    {
        "file": "basen/case_40_basen_convert.json",
        "name": "40. BASE-N 15 * 37 = 555 -> HEX 0000022B",
        "source": "guide",
        "setup": {"display": "LineIO"},
        "keys": ["MODE", "4", "SQUARE", "1", "5", "MUL", "3", "7", "EXE", "POWER"],
        "expect": {"result": "0000022B"}
    },
    {
        "file": "eqn/case_41_eqn_2unknown.json",
        "name": "41. EQN 1: x+2y=3, 2x+3y=4 -> x=-1, y=2",
        "source": "guide",
        "setup": {"display": "MthIO-MathO"},
        "keys": ["MODE", "5", "1", "1", "EXE", "2", "EXE", "3", "EXE", "2", "EXE", "3", "EXE", "4", "EXE", "EXE"],
        "expect": {"result": "-1"}
    },
    {
        "file": "eqn/case_42_eqn_cubic.json",
        "name": "42. EQN 4: x³-2x²-x+2=0 -> roots",
        "source": "guide",
        "setup": {"display": "MthIO-MathO"},
        "keys": ["MODE", "5", "4", "1", "EXE", "NEG", "2", "EXE", "NEG", "1", "EXE", "2", "EXE", "EXE"],
        "expect": {"result": "-1"}
    },
    {
        "file": "matrix/case_43_mat_det.json",
        "name": "43. MATRIX det([[2,1],[1,1]]) = 1",
        "source": "guide",
        "setup": {"display": "LineIO"},
        "keys": ["MODE", "6", "1", "5", "2", "EXE", "1", "EXE", "1", "EXE", "1", "EXE", "AC", "SHIFT", "4", "7", "SHIFT", "4", "3", "RPAREN", "EXE"],
        "expect": {"result": "1", "indicators": ["MAT"]}
    },
    {
        "file": "vector/case_44_vct_dot.json",
        "name": "44. VECTOR (1,2)·(3,4) = 11",
        "source": "guide",
        "setup": {"display": "LineIO"},
        "keys": ["MODE", "8", "1", "2", "1", "EXE", "2", "EXE", "AC", "SHIFT", "5", "1", "2", "2", "3", "EXE", "4", "EXE", "AC", "SHIFT", "5", "3", "SHIFT", "5", "7", "SHIFT", "5", "4", "EXE"],
        "expect": {"result": "11", "indicators": ["VCT"]}
    },
    {
        "file": "table/case_45_table_insufficient_mem.json",
        "name": "45. TABLE f(X)=X Start 1 End 40 Step 1 -> Insufficient MEM",
        "source": "guide",
        "setup": {"display": "MthIO-MathO"},
        "keys": ["MODE", "7", "ALPHA", "RPAREN", "EXE", "1", "EXE", "4", "0", "EXE", "1", "EXE"],
        "expect": {"error": "Insufficient MEM"}
    },
    {
        "file": "system/case_46_mode_0_id.json",
        "name": "46. MODE 0 -> Calculator ID, AC returns to MODE menu",
        "source": "guide",
        "setup": {"display": "MthIO-MathO"},
        "keys": ["MODE", "0"],
        "expect": {"indicators": []}
    },
    {
        "file": "calculate/case_47_omitted_mul_pi.json",
        "name": "47. 1 / 2π priority",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["1", "DIV", "2", "SHIFT", "EXP10", "EXE"],
        "expect": {"indicators": ["Math", "D"]}
    },
    {
        "file": "calculate/case_48_omitted_mul_paren.json",
        "name": "48. 6 / 2(1+2)",
        "source": "unverified",
        "setup": {"display": "MthIO-MathO", "angle": "Deg", "format": "Norm1"},
        "keys": ["6", "DIV", "2", "LPAREN", "1", "ADD", "2", "RPAREN", "EXE"],
        "expect": {"indicators": ["Math", "D"]}
    }
]

for c in cases:
    target_path = os.path.join('tests/golden', c['file'].replace('/', os.sep))
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    # Check if mode 4..8 or specific pending prompt
    content = {
        "name": c["name"],
        "source": c["source"],
        "setup": c["setup"],
        "keys": c["keys"],
        "expect": c["expect"]
    }
    # Mark cases needing future prompt implementations with expectedFail
    if any(k in c['file'] for k in ['cmplx', 'basen', 'eqn', 'matrix', 'vector', 'table', 'system']):
        content["expectedFail"] = True
        content["pendingPrompt"] = "Pending prompt for mode implementation"
    
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {len(cases)} golden test fixtures under tests/golden/")

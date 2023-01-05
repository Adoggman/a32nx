use std::vec::Vec;
use crate::{
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier},
};
use uom::si::{
    f64::{Length,  Ratio},
    length::{nautical_mile},
    ratio::{percent},
};

pub struct NavigationDisplay {
    range_knob_id: VariableIdentifier,
    range_knob_position: usize,
    range: Length,
    mode_id: VariableIdentifier,
    mode: u8,
    terrain_on_nd_pb_id: VariableIdentifier,
    terrain_on_nd_pb_active: bool,
    potentiometer_id: VariableIdentifier,
    potentiometer: Ratio,
}

impl NavigationDisplay {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        potentiometer: u32,
    ) -> Self {
        NavigationDisplay {
            range_knob_id: context.get_identifier(format!("EFIS_{}_ND_RANGE", side)),
            range_knob_position: 0,
            range: Length::new::<nautical_mile>(10.0),
            mode_id: context.get_identifier(format!("EFIS_{}_ND_MODE", side)),
            mode: 0,
            terrain_on_nd_pb_id: context.get_identifier(format!("EFIS_TERR_{}_ACTIVE", side)),
            terrain_on_nd_pb_active: false,
            potentiometer_id: context.get_identifier(format!("LIGHT POTENTIOMETER:{}", potentiometer)),
            potentiometer: Ratio::new::<percent>(100.0),
        }
    }

    pub fn update(&mut self, range_lookup: &Vec<Length>) {
        self.range = range_lookup[self.range_knob_position]
    }
}

impl SimulationElement for NavigationDisplay {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.range_knob_position = reader.read(&self.range_knob_id);
        self.mode = reader.read(&self.mode_id);
        self.terrain_on_nd_pb_active = reader.read(&self.terrain_on_nd_pb_id);
        self.potentiometer = Ratio::new::<percent>(reader.read(&self.potentiometer_id));
    }
}
